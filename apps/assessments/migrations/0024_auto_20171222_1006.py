# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-12-22 04:36
from __future__ import unicode_literals

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('assessments', '0023_surveyclassgendercorrectansagg_surveyclassquestionkeycorrectansagg_surveyquestiongroupquestionkeycor'),
    ]

    operations = [
        migrations.AddField(
            model_name='answergroup_institution',
            name='location',
            field=django.contrib.gis.db.models.fields.GeometryField(null=True, srid=4326),
        ),
        migrations.AddField(
            model_name='answergroup_student',
            name='location',
            field=django.contrib.gis.db.models.fields.GeometryField(null=True, srid=4326),
        ),
        migrations.AddField(
            model_name='answergroup_studentgroup',
            name='location',
            field=django.contrib.gis.db.models.fields.GeometryField(null=True, srid=4326),
        ),
    ]