from django.contrib import admin
from .models import QuestionnaireSubmission


class QuestionnaireSubmissionAdmin(admin.ModelAdmin):
    list_display = ('email', 'submission_date')
    list_filter = ('submission_date',)
    search_fields = ('email', 'data')
    readonly_fields = ('submission_date',)
    fieldsets = (
        (None, {
            'fields': ('email', 'submission_date')
        }),
        ('Questionnaire Data', {
            'fields': ('data',),
            'classes': ('collapse',)
        }),
    )

admin.site.register(QuestionnaireSubmission, QuestionnaireSubmissionAdmin)
