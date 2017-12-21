# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-12-21 11:41
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assessments', '0022_surveyquestiongroupquestionkeyagg'),
    ]

    operations = [
        migrations.CreateModel(
            name='SurveyClassGenderCorrectAnsAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sg_name', models.CharField(db_column='sg_name', max_length=100)),
                ('question_key', models.CharField(db_column='question_key', max_length=100)),
                ('year', models.IntegerField(db_column='year')),
                ('month', models.IntegerField(db_column='month')),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
            ],
            options={
                'db_table': 'mvw_survey_class_gender_correctans_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyClassQuestionKeyCorrectAnsAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sg_name', models.CharField(db_column='sg_name', max_length=100)),
                ('question_key', models.CharField(db_column='question_key', max_length=100)),
                ('year', models.IntegerField(db_column='year')),
                ('month', models.IntegerField(db_column='month')),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
            ],
            options={
                'db_table': 'mvw_survey_class_questionkey_correctans_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyQuestionGroupQuestionKeyCorrectAnsAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('questiongroup_id', models.CharField(db_column='questiongroup_id', max_length=100)),
                ('questiongroup_name', models.CharField(db_column='questiongroup_name', max_length=100)),
                ('question_key', models.CharField(db_column='question_key', max_length=100)),
                ('year', models.IntegerField(db_column='year')),
                ('month', models.IntegerField(db_column='month')),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
            ],
            options={
                'db_table': 'mvw_survey_questiongroup_questionkey_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyQuestionKeyCorrectAnsAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('question_key', models.CharField(db_column='question_key', max_length=100)),
                ('year', models.IntegerField(db_column='year')),
                ('month', models.IntegerField(db_column='month')),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
            ],
            options={
                'db_table': 'mvw_survey_questionkey_correctans_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyQuetionGroupGenderAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField(db_column='year')),
                ('month', models.IntegerField(db_column='month')),
                ('questiongroup_id', models.CharField(db_column='questiongroup_id', max_length=100)),
                ('questiongroup_name', models.CharField(db_column='questiongroup_name', max_length=100)),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
            ],
            options={
                'db_table': 'mvw_survey_questiongroup_gender_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyQuetionGroupGenderCorrectAnsAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('questiongroup_id', models.CharField(db_column='questiongroup_id', max_length=100)),
                ('questiongroup_name', models.CharField(db_column='questiongroup_name', max_length=100)),
                ('question_key', models.CharField(db_column='question_key', max_length=100)),
                ('year', models.IntegerField(db_column='year')),
                ('month', models.IntegerField(db_column='month')),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
            ],
            options={
                'db_table': 'mvw_survey_questiongroup_gender_correctans_agg',
                'managed': False,
            },
        ),
    ]
