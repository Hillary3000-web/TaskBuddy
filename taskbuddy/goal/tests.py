from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status

from .models import Task, DailyCheckIn, Habit


class TaskModelTests(TestCase):
    """Tests for the Task model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_task_creation(self):
        """Test creating a task with default values."""
        task = Task.objects.create(
            user=self.user,
            title='Test Task'
        )
        self.assertEqual(task.title, 'Test Task')
        self.assertEqual(task.priority, 'medium')
        self.assertFalse(task.completed)
        self.assertEqual(task.description, '')

    def test_task_with_all_fields(self):
        """Test creating a task with all fields."""
        due_date = timezone.now().date() + timedelta(days=7)
        task = Task.objects.create(
            user=self.user,
            title='Complete Task',
            description='A detailed description',
            priority='high',
            due_date=due_date,
            completed=False
        )
        self.assertEqual(task.priority, 'high')
        self.assertEqual(task.due_date, due_date)
        self.assertEqual(task.description, 'A detailed description')

    def test_task_str_representation(self):
        """Test task string representation."""
        task = Task.objects.create(user=self.user, title='My Task')
        self.assertIn('My Task', str(task))
        self.assertIn('○', str(task))  # Not completed

        task.completed = True
        task.save()
        self.assertIn('✓', str(task))  # Completed


class DailyCheckInTests(TestCase):
    """Tests for the DailyCheckIn model and streak calculation."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_single_checkin_creates_streak_of_one(self):
        """Test that a single check-in creates a streak of 1."""
        today = timezone.now().date()
        DailyCheckIn.objects.create(user=self.user, date=today)
        
        streak = DailyCheckIn.get_current_streak(self.user)
        self.assertEqual(streak, 1)

    def test_consecutive_days_increase_streak(self):
        """Test streak increases with consecutive check-ins."""
        today = timezone.now().date()
        
        # Create check-ins for 5 consecutive days
        for i in range(5):
            DailyCheckIn.objects.create(
                user=self.user,
                date=today - timedelta(days=i)
            )
        
        streak = DailyCheckIn.get_current_streak(self.user)
        self.assertEqual(streak, 5)

    def test_gap_breaks_streak(self):
        """Test that a gap in check-ins breaks the streak."""
        today = timezone.now().date()
        
        # Check-in today
        DailyCheckIn.objects.create(user=self.user, date=today)
        # Skip multiple days, check-in 3 days ago (clear gap)
        DailyCheckIn.objects.create(user=self.user, date=today - timedelta(days=3))
        
        streak = DailyCheckIn.get_current_streak(self.user)
        self.assertEqual(streak, 1)  # Only today counts

    def test_no_checkins_returns_zero(self):
        """Test that no check-ins returns a streak of 0."""
        streak = DailyCheckIn.get_current_streak(self.user)
        self.assertEqual(streak, 0)

    def test_weekly_checkins_returns_correct_dates(self):
        """Test weekly check-ins returns dates from last 7 days."""
        today = timezone.now().date()
        
        # Create check-ins for some days
        DailyCheckIn.objects.create(user=self.user, date=today)
        DailyCheckIn.objects.create(user=self.user, date=today - timedelta(days=2))
        DailyCheckIn.objects.create(user=self.user, date=today - timedelta(days=5))
        # This one should not be included (8 days ago)
        DailyCheckIn.objects.create(user=self.user, date=today - timedelta(days=8))
        
        weekly = DailyCheckIn.get_weekly_check_ins(self.user)
        self.assertEqual(len(weekly), 3)


class TaskAPITests(APITestCase):
    """Tests for task API endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        # Get JWT token
        response = self.client.post('/api/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_task(self):
        """Test creating a task via API."""
        data = {
            'title': 'API Task',
            'description': 'Created via API',
            'priority': 'high'
        }
        response = self.client.post('/api/tasks/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'API Task')

    def test_list_tasks(self):
        """Test listing user's tasks."""
        Task.objects.create(user=self.user, title='Task 1')
        Task.objects.create(user=self.user, title='Task 2')
        
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_toggle_task(self):
        """Test toggling task completion."""
        task = Task.objects.create(user=self.user, title='Toggle Me')
        self.assertFalse(task.completed)
        
        response = self.client.patch(f'/api/tasks/{task.id}/toggle/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['completed'])

    def test_delete_task(self):
        """Test deleting a task."""
        task = Task.objects.create(user=self.user, title='Delete Me')
        
        response = self.client.delete(f'/api/tasks/{task.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task.id).exists())

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated requests are denied."""
        self.client.credentials()  # Remove auth
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CheckInAPITests(APITestCase):
    """Tests for check-in and streak API endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        response = self.client.post('/api/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_check_in_creates_record(self):
        """Test that check-in creates a DailyCheckIn record."""
        response = self.client.post('/api/check-in/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['checked_in_today'])
        self.assertEqual(response.data['streak'], 1)

    def test_duplicate_checkin_returns_already_checked_in(self):
        """Test checking in twice on same day."""
        self.client.post('/api/check-in/')
        response = self.client.post('/api/check-in/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Already checked in', response.data['message'])

    def test_get_streak_returns_data(self):
        """Test getting streak information."""
        response = self.client.get('/api/streak/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('current_streak', response.data)
        self.assertIn('checked_in_today', response.data)
        self.assertIn('weekly_check_ins', response.data)


class RegisterAPITests(APITestCase):
    """Tests for user registration."""

    def test_register_new_user(self):
        """Test registering a new user."""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'SecurePass123!'
        }
        response = self.client.post('/api/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_register_duplicate_username_fails(self):
        """Test that duplicate username registration fails."""
        User.objects.create_user(
            username='existing',
            email='existing@example.com',
            password='pass123'
        )
        data = {
            'username': 'existing',
            'email': 'new@example.com',
            'password': 'SecurePass123!'
        }
        response = self.client.post('/api/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password_fails(self):
        """Test that weak passwords are rejected."""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': '123'  # Too short
        }
        response = self.client.post('/api/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
