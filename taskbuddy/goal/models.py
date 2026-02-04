"""
TaskBuddy - Django Models Module

This module defines the core data models for the TaskBuddy productivity application.
It includes models for task management, categorization, tagging, habit tracking,
and daily check-in streak functionality.

Models:
    - Habit: Legacy habit tracking with streak calculation
    - Category: Task categories with customizable colors
    - Tag: Flexible tagging system for task organization
    - Task: Core task entity with priority, due dates, and reminders
    - DailyCheckIn: Daily engagement tracking for streak calculation

Author: TaskBuddy Development Team
Version: 2.0.0
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class Habit(models.Model):
    """
    Legacy habit tracking model with streak functionality.
    
    This model tracks individual habits for users and calculates
    consecutive day streaks based on check-in activity.
    
    Attributes:
        user (ForeignKey): Reference to the owning User instance.
        title (str): The name/description of the habit (max 200 chars).
        current_streak (int): Number of consecutive days checked in.
        last_checkin (date): Date of the most recent check-in.
        created_at (datetime): Timestamp when the habit was created.
    
    Note:
        This model is considered legacy. New implementations should
        use the DailyCheckIn model for streak tracking.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    current_streak = models.IntegerField(default=0)
    last_checkin = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """Return string representation showing title and current streak."""
        return f"{self.title} - {self.current_streak} days"

    def checkin(self):
        """
        Record a check-in for this habit and update the streak.
        
        The streak is incremented if the user checked in yesterday.
        Otherwise, the streak resets to 1 day. Duplicate same-day
        check-ins are ignored.
        
        Side Effects:
            - Updates current_streak based on continuity
            - Sets last_checkin to today's date
            - Persists changes to database
        """
        today = timezone.now().date()
        if self.last_checkin == today:
            return
        if self.last_checkin == today - timedelta(days=1):
            self.current_streak += 1
        else:
            self.current_streak = 1
        self.last_checkin = today
        self.save()


class Category(models.Model):
    """
    Task category model with customizable color coding.
    
    Categories allow users to organize tasks into logical groups
    with visual color indicators for quick identification.
    
    Attributes:
        user (ForeignKey): Reference to the owning User instance.
        name (str): Category name (max 50 chars, unique per user).
        color (str): Hex color code from predefined COLOR_CHOICES.
        created_at (datetime): Timestamp when the category was created.
    
    Color Options:
        Indigo (#6366f1), Purple (#8b5cf6), Pink (#ec4899),
        Red (#ef4444), Orange (#f97316), Yellow (#eab308),
        Green (#22c55e), Teal (#14b8a6), Cyan (#06b6d4), Blue (#3b82f6)
    """
    COLOR_CHOICES = [
        ('#6366f1', 'Indigo'),
        ('#8b5cf6', 'Purple'),
        ('#ec4899', 'Pink'),
        ('#ef4444', 'Red'),
        ('#f97316', 'Orange'),
        ('#eab308', 'Yellow'),
        ('#22c55e', 'Green'),
        ('#14b8a6', 'Teal'),
        ('#06b6d4', 'Cyan'),
        ('#3b82f6', 'Blue'),
    ]

    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='categories',
        help_text="The user who owns this category"
    )
    name = models.CharField(
        max_length=50,
        help_text="Display name for the category"
    )
    color = models.CharField(
        max_length=7, 
        choices=COLOR_CHOICES, 
        default='#6366f1',
        help_text="Hex color code for visual identification"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        unique_together = ['user', 'name']
        ordering = ['name']

    def __str__(self):
        """Return the category name as string representation."""
        return self.name


class Tag(models.Model):
    """
    Flexible tagging model for task organization.
    
    Tags provide a many-to-many relationship with tasks, allowing
    flexible cross-cutting categorization independent of categories.
    
    Attributes:
        user (ForeignKey): Reference to the owning User instance.
        name (str): Tag name (max 30 chars, unique per user).
        created_at (datetime): Timestamp when the tag was created.
    
    Usage:
        Tags are typically used for:
        - Project identifiers (e.g., "project-alpha")
        - Context labels (e.g., "urgent", "waiting-on")
        - Custom groupings (e.g., "q1-goals")
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='tags',
        help_text="The user who owns this tag"
    )
    name = models.CharField(
        max_length=30,
        help_text="Short tag name for task labeling"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']

    def __str__(self):
        """Return the tag name as string representation."""
        return self.name


class Task(models.Model):
    """
    Core task model for the TaskBuddy application.
    
    Tasks are the primary work items that users create and manage.
    Each task supports priority levels, due dates, categorization,
    tagging, and reminder notifications.
    
    Attributes:
        user (ForeignKey): Reference to the owning User instance.
        title (str): Task title/name (max 200 chars, required).
        description (str): Optional detailed description.
        priority (str): Priority level - 'low', 'medium', or 'high'.
        due_date (date): Optional deadline date.
        completed (bool): Completion status flag.
        created_at (datetime): Timestamp when task was created.
        updated_at (datetime): Timestamp of last modification.
        category (ForeignKey): Optional category assignment.
        tags (ManyToMany): Associated tags for organization.
        reminder_time (datetime): Optional reminder notification time.
        reminder_sent (bool): Flag indicating if reminder was sent.
    
    Priority Levels:
        - 'low': Non-urgent, can be deferred
        - 'medium': Standard priority (default)
        - 'high': Urgent, requires immediate attention
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    # Core fields
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='tasks',
        help_text="The user who owns this task"
    )
    title = models.CharField(
        max_length=200,
        help_text="Task title or name"
    )
    description = models.TextField(
        blank=True, 
        default='',
        help_text="Optional detailed description"
    )
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_CHOICES, 
        default='medium',
        help_text="Task priority level"
    )
    due_date = models.DateField(
        null=True, 
        blank=True,
        help_text="Optional deadline date"
    )
    completed = models.BooleanField(
        default=False,
        help_text="Whether the task has been completed"
    )
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Organization fields
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='tasks',
        help_text="Optional category for grouping"
    )
    tags = models.ManyToManyField(
        Tag, 
        blank=True, 
        related_name='tasks',
        help_text="Tags for flexible organization"
    )
    
    # Reminder fields
    reminder_time = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When to send a reminder notification"
    )
    reminder_sent = models.BooleanField(
        default=False,
        help_text="Whether the reminder has been sent"
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        """Return string representation with title and completion status."""
        return f"{self.title} ({'✓' if self.completed else '○'})"


class DailyCheckIn(models.Model):
    """
    Daily check-in model for streak tracking.
    
    Records daily user engagement and provides methods for
    calculating current and historical streak information.
    
    Attributes:
        user (ForeignKey): Reference to the User who checked in.
        date (date): The date of the check-in.
        created_at (datetime): Timestamp when the check-in was recorded.
    
    Constraints:
        - Only one check-in per user per day (unique_together)
    
    Class Methods:
        get_current_streak(user): Calculate the current consecutive day streak.
        get_weekly_check_ins(user): Get check-in dates for the last 7 days.
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='check_ins',
        help_text="The user who performed this check-in"
    )
    date = models.DateField(
        help_text="The date of the check-in"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

    def __str__(self):
        """Return string showing username and check-in date."""
        return f"{self.user.username} - {self.date}"

    @classmethod
    def get_current_streak(cls, user):
        """
        Calculate the current consecutive day streak for a user.
        
        The streak counts consecutive days with check-ins, working
        backwards from today. If the user hasn't checked in today,
        the streak starts from yesterday (grace period).
        
        Args:
            user (User): The user to calculate streak for.
        
        Returns:
            int: Number of consecutive days with check-ins.
        
        Algorithm:
            1. Start with today as expected date
            2. If check-in matches expected, increment streak and move expected back
            3. If check-in is one day before expected (grace), start counting from there
            4. Stop on any gap in consecutive days
        """
        today = timezone.now().date()
        check_ins = cls.objects.filter(user=user).order_by('-date')
        
        if not check_ins.exists():
            return 0
        
        streak = 0
        expected_date = today
        
        for check_in in check_ins:
            if check_in.date == expected_date:
                streak += 1
                expected_date -= timedelta(days=1)
            elif check_in.date == expected_date - timedelta(days=1):
                # Allow for yesterday if not checked in today yet
                streak += 1
                expected_date = check_in.date - timedelta(days=1)
            else:
                break
        
        return streak

    @classmethod
    def get_weekly_check_ins(cls, user):
        """
        Get check-in dates for the last 7 days.
        
        Retrieves all check-in dates within the past week for
        display in weekly calendars and statistics.
        
        Args:
            user (User): The user to get check-ins for.
        
        Returns:
            list[str]: List of ISO-formatted date strings (YYYY-MM-DD).
        """
        today = timezone.now().date()
        week_ago = today - timedelta(days=6)
        check_ins = cls.objects.filter(
            user=user,
            date__gte=week_ago,
            date__lte=today
        ).values_list('date', flat=True)
        return [d.isoformat() for d in check_ins]