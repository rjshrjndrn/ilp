# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-07-04 05:21
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0001_initial'),
        ('boundary', '0003_auto_20170703_1731'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='boundary',
            unique_together=set([('name', 'parent', 'type')]),
        ),
    ]