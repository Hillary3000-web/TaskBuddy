"""
TaskBuddy - Django REST Framework Serializers

This module defines serializers for converting Django models to/from JSON
for the REST API. It includes validation logic and nested representations
for complex relationships.

Serializers:
    - HabitSerializer: Legacy habit model serialization
    - CategorySerializer: Category with task count
    - TagSerializer: Tag with task count
    - TaskSerializer: Task with nested category/tags and camelCase mapping
    - RegisterSerializer: User registration with password validation
    - UserProfileSerializer: Read-only user profile data
    - AnalyticsSerializer: Productivity statistics schema

Author: TaskBuddy Development Team
Version: 2.0.0
"""

from rest_framework import serializers
from .models import Habit, Task, DailyCheckIn, Category, Tag
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError


class HabitSerializer(serializers.ModelSerializer):
    """
    Serializer for the Habit model.
    
    Provides read-only serialization of habit data including
    streak information. Used primarily for API responses.
    
    Read-only Fields:
        - id: Primary key
        - created_at: Creation timestamp
    """
    class Meta:
        model = Habit
        fields = ['id', 'title', 'current_streak', 'last_checkin', 'created_at']
        read_only_fields = ['id', 'created_at']


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for the Category model with task count.
    
    Includes a computed field showing the number of tasks
    assigned to each category for UI display.
    
    Computed Fields:
        taskCount (int): Number of tasks in this category
    
    Read-only Fields:
        - id: Primary key
        - created_at: Creation timestamp
    """
    taskCount = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'color', 'taskCount', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_taskCount(self, obj):
        """
        Get the count of tasks assigned to this category.
        
        Args:
            obj (Category): The category instance being serialized.
            
        Returns:
            int: Number of tasks in this category.
        """
        return obj.tasks.count()


class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for the Tag model with task count.
    
    Includes a computed field showing the number of tasks
    tagged with this tag for UI display.
    
    Computed Fields:
        taskCount (int): Number of tasks with this tag
    
    Read-only Fields:
        - id: Primary key
        - created_at: Creation timestamp
    """
    taskCount = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ['id', 'name', 'taskCount', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_taskCount(self, obj):
        """
        Get the count of tasks tagged with this tag.
        
        Args:
            obj (Tag): The tag instance being serialized.
            
        Returns:
            int: Number of tasks with this tag.
        """
        return obj.tasks.count()


class TaskSerializer(serializers.ModelSerializer):
    """
    Comprehensive serializer for the Task model.
    
    Handles bidirectional serialization with camelCase mapping
    for JavaScript frontend compatibility. Supports both reading
    (with nested category/tags) and writing (with ID references).
    
    Field Mapping (camelCase <-> snake_case):
        - dueDate <-> due_date
        - reminderTime <-> reminder_time
        - categoryId <-> category (FK)
        - tagIds <-> tags (M2M)
    
    Write Fields:
        categoryId: Primary key of category (nullable)
        tagIds: List of tag primary keys
    
    Read Fields:
        category: Nested CategorySerializer
        tags: Nested list of TagSerializer
    
    Read-only Fields:
        - id: Primary key
        - created_at: Creation timestamp
        - reminder_sent: Whether reminder notification was sent
    """
    # CamelCase mapping for frontend compatibility
    dueDate = serializers.DateField(
        source='due_date', 
        required=False, 
        allow_null=True,
        help_text="Task deadline date (YYYY-MM-DD)"
    )
    reminderTime = serializers.DateTimeField(
        source='reminder_time', 
        required=False, 
        allow_null=True,
        help_text="When to send reminder notification (ISO 8601)"
    )
    
    # Write-only foreign key fields
    categoryId = serializers.PrimaryKeyRelatedField(
        source='category',
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
        help_text="Category ID for assignment"
    )
    tagIds = serializers.PrimaryKeyRelatedField(
        source='tags',
        queryset=Tag.objects.all(),
        many=True,
        required=False,
        help_text="List of tag IDs to assign"
    )
    
    # Read-only nested representations
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'priority', 'dueDate', 'completed',
            'created_at', 'categoryId', 'tagIds', 'category', 'tags',
            'reminderTime', 'reminder_sent'
        ]
        read_only_fields = ['id', 'created_at', 'reminder_sent']

    def to_representation(self, instance):
        """
        Convert model instance to JSON-compatible representation.
        
        Ensures dueDate is always present in the response,
        even when null, for frontend consistency.
        
        Args:
            instance (Task): The task instance being serialized.
            
        Returns:
            dict: JSON-compatible dictionary representation.
        """
        data = super().to_representation(instance)
        if 'dueDate' not in data:
            data['dueDate'] = None
        return data

    def validate_categoryId(self, value):
        """
        Validate that the category belongs to the requesting user.
        
        Prevents users from assigning tasks to categories they
        don't own, enforcing data isolation.
        
        Args:
            value (Category): The category instance to validate.
            
        Returns:
            Category: The validated category instance.
            
        Raises:
            ValidationError: If category doesn't belong to user.
        """
        if value:
            request = self.context.get('request') if self.context else None
            if request and hasattr(request, 'user'):
                if value.user != request.user:
                    raise serializers.ValidationError("Invalid category.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    
    Handles new user creation with email validation and
    Django's built-in password strength validation.
    
    Required Fields:
        username (str): Unique username
        email (str): Valid, unique email address
        password (str): Password meeting strength requirements
    
    Password Requirements:
        - Minimum 8 characters
        - Must pass Django's AUTH_PASSWORD_VALIDATORS
    
    Security:
        - Password is write-only (never returned in responses)
        - Email uniqueness is enforced
    """
    password = serializers.CharField(
        write_only=True, 
        min_length=8,
        help_text="Password (min 8 characters)"
    )
    email = serializers.EmailField(
        required=True,
        help_text="Valid email address"
    )

    class Meta:
        model = User
        fields = ('username', 'password', 'email')

    def validate_email(self, value):
        """
        Ensure email address is unique across all users.
        
        Args:
            value (str): The email address to validate.
            
        Returns:
            str: The validated email address.
            
        Raises:
            ValidationError: If email is already registered.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        """
        Validate password against Django's password validators.
        
        Applies all validators defined in AUTH_PASSWORD_VALIDATORS
        setting (e.g., minimum length, common passwords, numeric-only).
        
        Args:
            value (str): The password to validate.
            
        Returns:
            str: The validated password.
            
        Raises:
            ValidationError: If password doesn't meet requirements.
        """
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        """
        Create a new user with hashed password.
        
        Uses Django's create_user() method to ensure password
        is properly hashed before storage.
        
        Args:
            validated_data (dict): Validated registration data.
            
        Returns:
            User: The newly created user instance.
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for user profile information.
    
    Provides safe, non-sensitive user data for profile
    display in the frontend application.
    
    Fields:
        id (int): User primary key
        username (str): Display username
        email (str): User's email address
    
    All fields are read-only to prevent profile modification
    through this serializer.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        read_only_fields = ['id', 'username', 'email']


class AnalyticsSerializer(serializers.Serializer):
    """
    Serializer for productivity analytics data.
    
    Defines the schema for analytics API responses including
    task statistics, streak data, and historical trends.
    
    This is a non-model serializer used for documentation
    and response validation.
    
    Statistics Fields:
        totalTasks (int): Total number of user's tasks
        completedTasks (int): Number of completed tasks
        pendingTasks (int): Number of incomplete tasks
        completionRate (float): Percentage of tasks completed
        
    Streak Fields:
        currentStreak (int): Current consecutive day streak
        longestStreak (int): All-time longest streak
        
    Activity Fields:
        tasksCompletedToday (int): Tasks completed today
        tasksCompletedThisWeek (int): Tasks completed in last 7 days
        
    Distribution Fields:
        tasksByPriority (dict): Count by priority level
        weeklyProgress (list): Daily completion counts for past week
        checkInHistory (list): 30-day check-in history
    """
    totalTasks = serializers.IntegerField()
    completedTasks = serializers.IntegerField()
    pendingTasks = serializers.IntegerField()
    completionRate = serializers.FloatField()
    currentStreak = serializers.IntegerField()
    longestStreak = serializers.IntegerField()
    tasksCompletedToday = serializers.IntegerField()
    tasksCompletedThisWeek = serializers.IntegerField()
    tasksByPriority = serializers.DictField()
    weeklyProgress = serializers.ListField()
    checkInHistory = serializers.ListField()