# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-06-28 06:28
from __future__ import unicode_literals

import django.contrib.gis.db.models.fields
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('common', '0001_initial'),
        ('boundary', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Institution',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dise_code', models.CharField(max_length=300)),
                ('name', models.CharField(max_length=300)),
                ('year_established', models.CharField(blank=True, max_length=5, null=True)),
                ('rural_urban', models.CharField(blank=True, max_length=50, null=True)),
                ('phone_number', models.CharField(blank=True, max_length=50, null=True)),
                ('address', models.CharField(max_length=1000)),
                ('area', models.CharField(max_length=1000)),
                ('village', models.CharField(max_length=1000)),
                ('landmark', models.CharField(blank=True, max_length=1000, null=True)),
                ('instidentification', models.CharField(blank=True, max_length=1000, null=True)),
                ('instidentification2', models.CharField(blank=True, max_length=1000, null=True)),
                ('route_information', models.CharField(blank=True, max_length=1000, null=True)),
                ('coord', django.contrib.gis.db.models.fields.GeometryField(srid=4326)),
                ('admin0', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='institution_admin0', to='boundary.Boundary')),
                ('admin1', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='institution_admin1', to='boundary.Boundary')),
                ('admin2', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='institution_admin2', to='boundary.Boundary')),
                ('admin3', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='institution_admin3', to='boundary.Boundary')),
            ],
        ),
        migrations.CreateModel(
            name='InstitutionCategory',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=300)),
                ('institution_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.InstitutionType')),
            ],
        ),
        migrations.CreateModel(
            name='Management',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=300)),
            ],
        ),
        migrations.CreateModel(
            name='PinCode',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('geom', django.contrib.gis.db.models.fields.GeometryField(srid=4326)),
            ],
        ),
        migrations.CreateModel(
            name='Qualification',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='Staff',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('first_name', models.CharField(max_length=50)),
                ('middle_name', models.CharField(blank=True, max_length=50, null=True)),
                ('last_name', models.CharField(blank=True, max_length=50, null=True)),
                ('uid', models.CharField(blank=True, max_length=100, null=True)),
                ('doj', models.DateField(max_length=20, null=True)),
                ('gender', models.ForeignKey(default='f', on_delete=django.db.models.deletion.CASCADE, to='common.Gender')),
                ('institution', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.Institution')),
                ('mt', models.ForeignKey(default='kan', on_delete=django.db.models.deletion.CASCADE, to='common.Language')),
            ],
        ),
        migrations.CreateModel(
            name='StaffQualification',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('qualification', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.Qualification')),
                ('staff', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.Staff')),
            ],
        ),
        migrations.CreateModel(
            name='StaffStudentGroupRelation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('academic_year', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.AcademicYear')),
                ('staff', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.Staff')),
                ('status', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.Status')),
            ],
        ),
        migrations.CreateModel(
            name='StaffTraining',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('staff', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.Staff')),
            ],
        ),
        migrations.CreateModel(
            name='StaffType',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('staff_type', models.CharField(max_length=100)),
                ('institution_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.InstitutionType')),
            ],
        ),
        migrations.CreateModel(
            name='Student',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('first_name', models.CharField(max_length=50)),
                ('middle_name', models.CharField(blank=True, max_length=50, null=True)),
                ('last_name', models.CharField(blank=True, max_length=50, null=True)),
                ('uid', models.CharField(blank=True, max_length=100, null=True)),
                ('dob', models.DateField(max_length=20, null=True)),
                ('enrollment_id', models.CharField(blank=True, max_length=100, null=True)),
                ('mother_name', models.CharField(blank=True, max_length=50, null=True)),
                ('father_name', models.CharField(blank=True, max_length=50, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='StudentCategory',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='StudentGroup',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('section', models.CharField(blank=True, max_length=10, null=True)),
                ('group_type', models.ForeignKey(default='class', on_delete=django.db.models.deletion.CASCADE, to='common.GroupType')),
                ('institution', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.Institution')),
                ('status', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.Status')),
            ],
            options={
                'ordering': ['name', 'section'],
            },
        ),
        migrations.CreateModel(
            name='StudentReligion',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='StudentStudentGroupRelation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('academic_year', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.AcademicYear')),
                ('status', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.Status')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.Student')),
                ('student_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.StudentGroup')),
            ],
        ),
        migrations.CreateModel(
            name='Training',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
            ],
        ),
        migrations.AddField(
            model_name='student',
            name='category',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='schools.StudentCategory'),
        ),
        migrations.AddField(
            model_name='student',
            name='gender',
            field=models.ForeignKey(default='m', on_delete=django.db.models.deletion.CASCADE, to='common.Gender'),
        ),
        migrations.AddField(
            model_name='student',
            name='institution',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.Institution'),
        ),
        migrations.AddField(
            model_name='student',
            name='mt',
            field=models.ForeignKey(default='kan', on_delete=django.db.models.deletion.CASCADE, to='common.Language'),
        ),
        migrations.AddField(
            model_name='student',
            name='religion',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='schools.StudentReligion'),
        ),
        migrations.AddField(
            model_name='student',
            name='status',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.Status'),
        ),
        migrations.AddField(
            model_name='stafftraining',
            name='training',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.Training'),
        ),
        migrations.AddField(
            model_name='staffstudentgrouprelation',
            name='student_group',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.StudentGroup'),
        ),
        migrations.AddField(
            model_name='staff',
            name='staff_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.StaffType'),
        ),
        migrations.AddField(
            model_name='staff',
            name='status',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.Status'),
        ),
        migrations.AddField(
            model_name='institution',
            name='category',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.InstitutionCategory'),
        ),
        migrations.AddField(
            model_name='institution',
            name='gender',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.Gender'),
        ),
        migrations.AddField(
            model_name='institution',
            name='gp',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='institution_gp', to='boundary.ElectionBoundary'),
        ),
        migrations.AddField(
            model_name='institution',
            name='institution_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.InstitutionType'),
        ),
        migrations.AddField(
            model_name='institution',
            name='last_verified_year',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.AcademicYear'),
        ),
        migrations.AddField(
            model_name='institution',
            name='management',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.Management'),
        ),
        migrations.AddField(
            model_name='institution',
            name='mla',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='institution_mla', to='boundary.ElectionBoundary'),
        ),
        migrations.AddField(
            model_name='institution',
            name='moi',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.Language'),
        ),
        migrations.AddField(
            model_name='institution',
            name='mp',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='institution_mp', to='boundary.ElectionBoundary'),
        ),
        migrations.AddField(
            model_name='institution',
            name='pincode',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='schools.PinCode'),
        ),
        migrations.AddField(
            model_name='institution',
            name='status',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.Status'),
        ),
        migrations.AddField(
            model_name='institution',
            name='ward',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='institution_ward', to='boundary.ElectionBoundary'),
        ),
        migrations.AlterUniqueTogether(
            name='studentstudentgrouprelation',
            unique_together=set([('student', 'student_group', 'academic_year')]),
        ),
        migrations.AlterUniqueTogether(
            name='studentgroup',
            unique_together=set([('institution', 'name', 'section')]),
        ),
        migrations.AlterUniqueTogether(
            name='staffstudentgrouprelation',
            unique_together=set([('staff', 'student_group', 'academic_year')]),
        ),
        migrations.AlterUniqueTogether(
            name='institution',
            unique_together=set([('dise_code',)]),
        ),
    ]