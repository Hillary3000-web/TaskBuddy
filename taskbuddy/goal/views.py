"""
TaskBuddy - Django REST Framework Views

This module defines all API endpoints for the TaskBuddy application.
It includes views for authentication, task management, categories,
tags, analytics, notifications, and streak tracking.

View Categories:
    - Authentication: Register, login (via SimpleJWT)
    - Categories: CRUD operations for task categories
    - Tags: CRUD operations for task tags
    - Tasks: CRUD with filtering, toggle completion
    - Analytics: Productivity statistics and charts
    - Notifications: Due dates, reminders, streaks
    - Check-ins: Daily engagement tracking

Author: TaskBuddy Development Team
Version: 2.0.0
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta

from .models import Habit, Task, DailyCheckIn, Category, Tag
from .serializers import (
    HabitSerializer, 
    TaskSerializer, 
    RegisterSerializer, 
    UserProfileSerializer,
    CategorySerializer,
    TagSerializer,
    AnalyticsSerializer
)


# ============================================================================
# AUTHENTICATION VIEWS
# ============================================================================

class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.
    
    Creates a new user account with validated credentials.
    Password is automatically hashed using Django's authentication system.
    
    Endpoint: POST /api/register/
    
    Request Body:
        {
            "username": "string",
            "email": "string", 
            "password": "string"
        }
    
    Response (201 Created):
        {
            "username": "string",
            "email": "string"
        }
    
    Errors:
        400: Validation failed (duplicate email, weak password, etc.)
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


# ============================================================================
# CATEGORY VIEWS
# ============================================================================

class CategoryListCreateView(generics.ListCreateAPIView):
    """
    List and create categories endpoint.
    
    Retrieves all categories for the authenticated user or
    creates a new category with color customization.
    
    Endpoints:
        GET /api/categories/ - List all user's categories
        POST /api/categories/ - Create new category
    
    Query Parameters: None
    
    Request Body (POST):
        {
            "name": "string",
            "color": "#hexcode"  // optional, defaults to indigo
        }
    
    Response:
        [{
            "id": int,
            "name": "string",
            "color": "#hexcode",
            "taskCount": int,
            "created_at": "datetime"
        }]
    """
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter categories to only return those owned by the requesting user."""
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically assign the category to the requesting user."""
        serializer.save(user=self.request.user)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Category detail endpoint for CRUD operations.
    
    Retrieve, update, or delete a specific category.
    Users can only access their own categories.
    
    Endpoints:
        GET /api/categories/{id}/ - Get category details
        PUT/PATCH /api/categories/{id}/ - Update category
        DELETE /api/categories/{id}/ - Delete category
    
    Note:
        Deleting a category does NOT delete associated tasks.
        Tasks will have their category set to null.
    """
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter to only allow access to user's own categories."""
        return Category.objects.filter(user=self.request.user)


# ============================================================================
# TAG VIEWS
# ============================================================================

class TagListCreateView(generics.ListCreateAPIView):
    """
    List and create tags endpoint.
    
    Retrieves all tags for the authenticated user or creates a new tag.
    Tags provide flexible many-to-many organization for tasks.
    
    Endpoints:
        GET /api/tags/ - List all user's tags
        POST /api/tags/ - Create new tag
    
    Request Body (POST):
        {
            "name": "string"
        }
    
    Response:
        [{
            "id": int,
            "name": "string",
            "taskCount": int,
            "created_at": "datetime"
        }]
    """
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter tags to only return those owned by the requesting user."""
        return Tag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically assign the tag to the requesting user."""
        serializer.save(user=self.request.user)


class TagDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Tag detail endpoint for CRUD operations.
    
    Retrieve, update, or delete a specific tag.
    Users can only access their own tags.
    
    Endpoints:
        GET /api/tags/{id}/ - Get tag details
        PUT/PATCH /api/tags/{id}/ - Update tag
        DELETE /api/tags/{id}/ - Delete tag
    
    Note:
        Deleting a tag removes it from all associated tasks
        but does not delete the tasks themselves.
    """
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter to only allow access to user's own tags."""
        return Tag.objects.filter(user=self.request.user)


# ============================================================================
# TASK VIEWS
# ============================================================================

class TaskListCreateView(generics.ListCreateAPIView):
    """
    List and create tasks endpoint with filtering support.
    
    Retrieves all tasks for the authenticated user with optional
    filtering by category, tag, status, and priority. Also handles
    task creation with full field support.
    
    Endpoints:
        GET /api/tasks/ - List tasks with optional filters
        POST /api/tasks/ - Create new task
    
    Query Parameters:
        category (int): Filter by category ID
        tag (int): Filter by tag ID
        status (str): 'completed' or 'pending'
        priority (str): 'high', 'medium', or 'low'
    
    Request Body (POST):
        {
            "title": "string",
            "description": "string",  // optional
            "priority": "string",     // optional, default: medium
            "dueDate": "YYYY-MM-DD",  // optional
            "categoryId": int,        // optional
            "tagIds": [int],          // optional
            "reminderTime": "ISO8601" // optional
        }
    
    Response:
        [{
            "id": int,
            "title": "string",
            "description": "string",
            "priority": "string",
            "dueDate": "string",
            "completed": bool,
            "category": {...},
            "tags": [{...}],
            "reminderTime": "datetime",
            "created_at": "datetime"
        }]
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Build filtered queryset based on query parameters.
        
        Applies user ownership filter and optional filters for
        category, tag, completion status, and priority level.
        
        Returns:
            QuerySet: Filtered and distinct task queryset.
        """
        queryset = Task.objects.filter(user=self.request.user)
        
        # Filter by category ID
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by tag ID (through M2M relationship)
        tag_id = self.request.query_params.get('tag')
        if tag_id:
            queryset = queryset.filter(tags__id=tag_id)
        
        # Filter by completion status
        status_filter = self.request.query_params.get('status')
        if status_filter == 'completed':
            queryset = queryset.filter(completed=True)
        elif status_filter == 'pending':
            queryset = queryset.filter(completed=False)
        
        # Filter by priority level
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Use distinct() to prevent duplicates from M2M joins
        return queryset.distinct()

    def perform_create(self, serializer):
        """Automatically assign the task to the requesting user."""
        serializer.save(user=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Task detail endpoint for CRUD operations.
    
    Retrieve, update, or delete a specific task.
    Supports partial updates via PATCH.
    
    Endpoints:
        GET /api/tasks/{id}/ - Get task details
        PUT/PATCH /api/tasks/{id}/ - Update task
        DELETE /api/tasks/{id}/ - Delete task
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter to only allow access to user's own tasks."""
        return Task.objects.filter(user=self.request.user)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_task(request, pk):
    """
    Toggle task completion status.
    
    Flips the completed boolean for the specified task.
    Commonly used for checkbox interactions in the UI.
    
    Endpoint: PATCH /api/tasks/{id}/toggle/
    
    Path Parameters:
        pk (int): Task ID to toggle
    
    Response (200):
        Full updated task object with new completion status
    
    Errors:
        404: Task not found or not owned by user
    """
    task = get_object_or_404(Task, pk=pk, user=request.user)
    task.completed = not task.completed
    task.save()
    serializer = TaskSerializer(task)
    return Response(serializer.data)


# ============================================================================
# ANALYTICS VIEWS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analytics(request):
    """
    Get comprehensive productivity analytics.
    
    Aggregates various statistics about the user's tasks and
    check-in activity for dashboard charts and metrics.
    
    Endpoint: GET /api/analytics/
    
    Response (200):
        {
            "totalTasks": int,
            "completedTasks": int,
            "pendingTasks": int,
            "completionRate": float,      // percentage 0-100
            "currentStreak": int,         // consecutive days
            "longestStreak": int,         // all-time record
            "tasksCompletedToday": int,
            "tasksCompletedThisWeek": int,
            "tasksByPriority": {
                "high": int,
                "medium": int,
                "low": int
            },
            "weeklyProgress": [           // last 7 days
                {"date": "YYYY-MM-DD", "day": "Mon", "completed": int}
            ],
            "checkInHistory": [           // last 30 days
                {"date": "YYYY-MM-DD", "checkedIn": bool}
            ]
        }
    
    Performance Note:
        This endpoint makes multiple database queries. Consider
        caching for high-traffic scenarios.
    """
    user = request.user
    today = timezone.now().date()
    week_ago = today - timedelta(days=6)
    month_ago = today - timedelta(days=29)
    
    # ---- Task Statistics ----
    all_tasks = Task.objects.filter(user=user)
    total_tasks = all_tasks.count()
    completed_tasks = all_tasks.filter(completed=True).count()
    pending_tasks = total_tasks - completed_tasks
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Tasks completed today (based on updated_at timestamp)
    tasks_completed_today = all_tasks.filter(
        completed=True,
        updated_at__date=today
    ).count()
    
    # Tasks completed in the last 7 days
    tasks_completed_this_week = all_tasks.filter(
        completed=True,
        updated_at__date__gte=week_ago
    ).count()
    
    # Distribution by priority level
    tasks_by_priority = {
        'high': all_tasks.filter(priority='high').count(),
        'medium': all_tasks.filter(priority='medium').count(),
        'low': all_tasks.filter(priority='low').count(),
    }
    
    # ---- Weekly Progress Chart Data ----
    weekly_progress = []
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        count = all_tasks.filter(
            completed=True,
            updated_at__date=date
        ).count()
        weekly_progress.append({
            'date': date.isoformat(),
            'day': date.strftime('%a'),
            'completed': count
        })
    
    # ---- Streak Calculations ----
    current_streak = DailyCheckIn.get_current_streak(user)
    
    # Calculate longest streak by iterating through all check-ins
    check_ins = DailyCheckIn.objects.filter(user=user).order_by('date')
    longest_streak = 0
    current_count = 0
    prev_date = None
    
    for check_in in check_ins:
        if prev_date is None or check_in.date == prev_date + timedelta(days=1):
            current_count += 1
        else:
            current_count = 1
        longest_streak = max(longest_streak, current_count)
        prev_date = check_in.date
    
    # ---- 30-Day Check-in History ----
    check_in_history = []
    check_in_dates = set(
        DailyCheckIn.objects.filter(
            user=user,
            date__gte=month_ago
        ).values_list('date', flat=True)
    )
    
    for i in range(29, -1, -1):
        date = today - timedelta(days=i)
        check_in_history.append({
            'date': date.isoformat(),
            'checkedIn': date in check_in_dates
        })
    
    return Response({
        'totalTasks': total_tasks,
        'completedTasks': completed_tasks,
        'pendingTasks': pending_tasks,
        'completionRate': round(completion_rate, 1),
        'currentStreak': current_streak,
        'longestStreak': longest_streak,
        'tasksCompletedToday': tasks_completed_today,
        'tasksCompletedThisWeek': tasks_completed_this_week,
        'tasksByPriority': tasks_by_priority,
        'weeklyProgress': weekly_progress,
        'checkInHistory': check_in_history
    })


# ============================================================================
# NOTIFICATION VIEWS
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """
    Get pending notifications for the user.
    
    Aggregates notifications from various sources:
    - Tasks due today
    - Overdue tasks
    - Reminder times that have passed
    - Streak check-in reminders
    
    Endpoint: GET /api/notifications/
    
    Response (200):
        {
            "notifications": [
                {
                    "id": "string",           // unique identifier
                    "type": "string",         // due_today, overdue, reminder, streak
                    "title": "string",
                    "message": "string",
                    "taskId": int,            // optional, for task-related
                    "priority": "string"
                }
            ],
            "count": int
        }
    
    Side Effects:
        - Marks reminder notifications as sent to prevent duplicates
    
    Notification Types:
        - due_today: Tasks with due_date matching today
        - overdue: Tasks with due_date in the past
        - reminder: Tasks with reminder_time that has passed
        - streak: Daily check-in reminder if streak is at risk
    """
    user = request.user
    now = timezone.now()
    today = now.date()
    
    notifications = []
    
    # ---- Tasks Due Today ----
    tasks_due_today = Task.objects.filter(
        user=user,
        due_date=today,
        completed=False
    )
    for task in tasks_due_today:
        notifications.append({
            'id': f'due-{task.id}',
            'type': 'due_today',
            'title': 'Task Due Today',
            'message': f'"{task.title}" is due today!',
            'taskId': task.id,
            'priority': task.priority
        })
    
    # ---- Overdue Tasks ----
    overdue_tasks = Task.objects.filter(
        user=user,
        due_date__lt=today,
        completed=False
    )
    for task in overdue_tasks:
        days_overdue = (today - task.due_date).days
        notifications.append({
            'id': f'overdue-{task.id}',
            'type': 'overdue',
            'title': 'Overdue Task',
            'message': f'"{task.title}" is {days_overdue} day(s) overdue!',
            'taskId': task.id,
            'priority': 'high'  # Always high priority for overdue
        })
    
    # ---- Triggered Reminders ----
    tasks_with_reminders = Task.objects.filter(
        user=user,
        reminder_time__lte=now,
        reminder_sent=False,
        completed=False
    )
    for task in tasks_with_reminders:
        notifications.append({
            'id': f'reminder-{task.id}',
            'type': 'reminder',
            'title': 'Task Reminder',
            'message': f'Reminder: "{task.title}"',
            'taskId': task.id,
            'priority': task.priority
        })
        # Mark reminder as sent to prevent duplicate notifications
        task.reminder_sent = True
        task.save()
    
    # ---- Streak Check-in Reminder ----
    checked_in_today = DailyCheckIn.objects.filter(
        user=user,
        date=today
    ).exists()
    
    if not checked_in_today:
        current_streak = DailyCheckIn.get_current_streak(user)
        if current_streak > 0:
            notifications.append({
                'id': 'streak-reminder',
                'type': 'streak',
                'title': 'Keep Your Streak!',
                'message': f"Don't forget to check in! Your current streak: {current_streak} days",
                'priority': 'medium'
            })
    
    return Response({
        'notifications': notifications,
        'count': len(notifications)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dismiss_notification(request, notification_id):
    """
    Dismiss a notification.
    
    Acknowledges a notification to remove it from the active list.
    Currently a simplified implementation that returns success.
    
    Endpoint: POST /api/notifications/{notification_id}/dismiss/
    
    Path Parameters:
        notification_id (str): The notification ID to dismiss
    
    Response (200):
        {"status": "dismissed"}
    
    Future Improvements:
        - Store dismissed notifications in database
        - Allow re-enabling notifications
        - Track notification engagement metrics
    """
    return Response({'status': 'dismissed'})


# ============================================================================
# STREAK / CHECK-IN VIEWS
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_in(request):
    """
    Record daily check-in and return updated streak.
    
    Creates a check-in record for today. Duplicate same-day
    check-ins are handled gracefully (returns existing streak).
    
    Endpoint: POST /api/check-in/
    
    Response (200):
        {
            "message": "string",
            "streak": int,
            "checked_in_today": true
        }
    
    Idempotency:
        Multiple calls on the same day return the same result
        without creating duplicate records.
    """
    today = timezone.now().date()
    
    # Use get_or_create for idempotent check-in
    check_in_obj, created = DailyCheckIn.objects.get_or_create(
        user=request.user,
        date=today
    )
    
    if not created:
        return Response({
            'message': 'Already checked in today',
            'streak': DailyCheckIn.get_current_streak(request.user),
            'checked_in_today': True
        })
    
    return Response({
        'message': 'Check-in successful!',
        'streak': DailyCheckIn.get_current_streak(request.user),
        'checked_in_today': True
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_streak(request):
    """
    Get current streak and weekly check-in data.
    
    Returns the user's current consecutive day streak
    and a list of check-in dates for the past week.
    
    Endpoint: GET /api/streak/
    
    Response (200):
        {
            "current_streak": int,
            "checked_in_today": bool,
            "weekly_check_ins": ["YYYY-MM-DD", ...]
        }
    """
    today = timezone.now().date()
    checked_in_today = DailyCheckIn.objects.filter(
        user=request.user,
        date=today
    ).exists()
    
    return Response({
        'current_streak': DailyCheckIn.get_current_streak(request.user),
        'checked_in_today': checked_in_today,
        'weekly_check_ins': DailyCheckIn.get_weekly_check_ins(request.user)
    })


# ============================================================================
# USER PROFILE VIEW
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get current user profile information.
    
    Returns basic, non-sensitive user data for profile display.
    
    Endpoint: GET /api/user/profile/
    
    Response (200):
        {
            "id": int,
            "username": "string",
            "email": "string"
        }
    """
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)


# ============================================================================
# LEGACY HABIT VIEWS
# ============================================================================

class HabitListCreateView(generics.ListCreateAPIView):
    """
    Legacy habit list and create endpoint.
    
    Note: This is a legacy feature. New implementations should
    use the DailyCheckIn model for streak tracking.
    
    Endpoints:
        GET /api/habits/ - List user's habits
        POST /api/habits/ - Create new habit
    """
    serializer_class = HabitSerializer

    def get_queryset(self):
        """Filter habits to only return those owned by the requesting user."""
        return Habit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically assign the habit to the requesting user."""
        serializer.save(user=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkin_habit(request, pk):
    """
    Legacy habit check-in endpoint.
    
    Records a check-in for a specific habit and updates its streak.
    
    Note: This is a legacy feature. Use DailyCheckIn for new implementations.
    
    Endpoint: POST /api/habits/{id}/checkin/
    
    Response (200):
        {
            "status": "checked in",
            "current_streak": int
        }
    """
    habit = get_object_or_404(Habit, pk=pk, user=request.user)
    habit.checkin()
    return Response({"status": "checked in", "current_streak": habit.current_streak})
