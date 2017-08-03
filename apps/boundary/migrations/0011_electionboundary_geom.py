# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-08-03 04:10
from __future__ import unicode_literals

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('boundary', '0010_boundaryhierarchy'),
    ]

    operations = [
        migrations.AddField(
            model_name='electionboundary',
            name='geom',
            field=django.contrib.gis.db.models.fields.GeometryField(null=True, srid=4326),
        ),
    ]
