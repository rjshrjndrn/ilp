# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-11-27 16:47
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assessments', '0014_auto_20171127_1017'),
    ]

    operations = [
        migrations.CreateModel(
            name='SurveyAnsAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_month', models.CharField(db_column='year_month', max_length=10)),
                ('answer_option', models.CharField(db_column='answer_option', max_length=100)),
                ('num_answers', models.IntegerField(db_column='num_answers')),
            ],
            options={
                'db_table': 'mvw_survey_ans_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyBoundaryAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_month', models.CharField(db_column='year_month', max_length=10)),
                ('num_schools', models.IntegerField(db_column='num_schools')),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
                ('num_children', models.IntegerField(db_column='num_children')),
                ('num_users', models.IntegerField(db_column='num_users')),
                ('num_verified_assessment', models.IntegerField(db_column='num_verified_assessments')),
                ('last_assessment', models.DateField(db_column='last_assessment')),
            ],
            options={
                'db_table': 'mvw_survey_boundary_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyClassAnsAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_month', models.CharField(db_column='year_month', max_length=10)),
                ('sg_name', models.CharField(db_column='sg_name', max_length=100)),
                ('answer_option', models.CharField(db_column='answer_option', max_length=100)),
                ('num_answers', models.IntegerField(db_column='num_answers')),
            ],
            options={
                'db_table': 'mvw_survey_classs_ans_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyClassGenderAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_month', models.CharField(db_column='year_month', max_length=10)),
                ('sg_name', models.CharField(db_column='sg_name', max_length=100)),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
                ('num_correct_assessments', models.IntegerField(db_column='num_correct_assessments')),
            ],
            options={
                'db_table': 'mvw_survey_classs_gender_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyDetailsAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_month', models.CharField(db_column='year_month', max_length=10)),
                ('num_schools', models.IntegerField(db_column='num_schools')),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
                ('num_children', models.IntegerField(db_column='num_children')),
                ('num_users', models.IntegerField(db_column='num_users')),
                ('num_verified_assessment', models.IntegerField(db_column='num_verified_assessments')),
                ('last_assessment', models.DateField(db_column='last_assessment')),
            ],
            options={
                'db_table': 'mvw_survey_details_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyElectionBoundaryAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_month', models.CharField(db_column='year_month', max_length=10)),
                ('num_schools', models.IntegerField(db_column='num_schools')),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
                ('num_children', models.IntegerField(db_column='num_children')),
                ('num_users', models.IntegerField(db_column='num_users')),
                ('num_verified_assessment', models.IntegerField(db_column='num_verified_assessments')),
                ('last_assessment', models.DateField(db_column='last_assessment')),
            ],
            options={
                'db_table': 'mvw_survey_election_boundary_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyInstitutionAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_month', models.CharField(db_column='year_month', max_length=10)),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
                ('num_children', models.IntegerField(db_column='num_children')),
                ('num_users', models.IntegerField(db_column='num_users')),
                ('num_verified_assessment', models.IntegerField(db_column='num_verified_assessments')),
                ('last_assessment', models.DateField(db_column='last_assessment')),
            ],
            options={
                'db_table': 'mvw_survey_institution_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyQuestionKeyAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_month', models.CharField(db_column='year_month', max_length=10)),
                ('question_key', models.CharField(db_column='question_key', max_length=100)),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
                ('num_correct_assessments', models.IntegerField(db_column='num_correct_assessments')),
            ],
            options={
                'db_table': 'mvw_survey_questionkey_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyRespondentTypeAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_month', models.CharField(db_column='year_month', max_length=10)),
                ('num_schools', models.IntegerField(db_column='num_schools')),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
                ('num_children', models.IntegerField(db_column='num_children')),
                ('num_verified_assessment', models.IntegerField(db_column='num_verified_assessments')),
                ('last_assessment', models.DateField(db_column='last_assessment')),
            ],
            options={
                'db_table': 'mvw_survey_respondenttype_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveySummaryAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_month', models.CharField(db_column='year_month', max_length=10)),
                ('num_schools', models.IntegerField(db_column='num_schools')),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
                ('num_children', models.IntegerField(db_column='num_children')),
            ],
            options={
                'db_table': 'mvw_survey_summary_agg',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='SurveyUserTypeAgg',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year_month', models.CharField(db_column='year_month', max_length=10)),
                ('num_schools', models.IntegerField(db_column='num_schools')),
                ('num_assessments', models.IntegerField(db_column='num_assessments')),
                ('num_children', models.IntegerField(db_column='num_children')),
                ('num_verified_assessment', models.IntegerField(db_column='num_verified_assessments')),
                ('last_assessment', models.DateField(db_column='last_assessment')),
            ],
            options={
                'db_table': 'mvw_survey_usertype_agg',
                'managed': False,
            },
        ),
    ]