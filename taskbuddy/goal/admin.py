from django.contrib import admin
from .models import Habit, Task, DailyCheckIn, Category, Tag


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'current_streak', 'last_checkin', 'created_at']
    list_filter = ['user']
    search_fields = ['title']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'user', 'created_at']
    list_filter = ['user', 'color']
    search_fields = ['name']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'created_at']
    list_filter = ['user']
    search_fields = ['name']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'priority', 'category', 'completed', 'due_date', 'created_at']
    list_filter = ['user', 'priority', 'completed', 'category']
    search_fields = ['title', 'description']
    filter_horizontal = ['tags']


@admin.register(DailyCheckIn)
class DailyCheckInAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'created_at']
    list_filter = ['user', 'date']
    date_hierarchy = 'date'