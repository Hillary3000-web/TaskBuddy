from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    HabitListCreateView, 
    RegisterView, 
    checkin_habit,
    TaskListCreateView,
    TaskDetailView,
    toggle_task,
    check_in,
    get_streak,
    user_profile,
    CategoryListCreateView,
    CategoryDetailView,
    TagListCreateView,
    TagDetailView,
    get_analytics,
    get_notifications,
    dismiss_notification
)


urlpatterns = [
    # Auth - JWT Token endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    # Legacy login alias (for backward compatibility)
    path('login/', TokenObtainPairView.as_view(), name='login'),

    
    # User Profile
    path('user/profile/', user_profile, name='user_profile'),
    
    # Categories
    path('categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    
    # Tags
    path('tags/', TagListCreateView.as_view(), name='tag-list-create'),
    path('tags/<int:pk>/', TagDetailView.as_view(), name='tag-detail'),
    
    # Tasks
    path('tasks/', TaskListCreateView.as_view(), name='task-list-create'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:pk>/toggle/', toggle_task, name='task-toggle'),
    
    # Analytics
    path('analytics/', get_analytics, name='analytics'),
    
    # Notifications
    path('notifications/', get_notifications, name='notifications'),
    path('notifications/<str:notification_id>/dismiss/', dismiss_notification, name='dismiss-notification'),
    
    # Streak & Check-in
    path('check-in/', check_in, name='check_in'),
    path('streak/', get_streak, name='get_streak'),
    
    # Habits (legacy)
    path('habits/', HabitListCreateView.as_view(), name='habit-list-create'),
    path('habits/<int:pk>/checkin/', checkin_habit, name='habit-checkin'),
]