# -*- coding: utf-8 -*-
# Generated by Django 1.11.1 on 2017-06-28 06:17
from __future__ import unicode_literals

import django.contrib.gis.db.models.fields
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('common', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='BasicData',
            fields=[
                ('district', models.CharField(blank=True, max_length=50)),
                ('school_code', models.IntegerField(primary_key=True, serialize=False)),
                ('school_name', models.CharField(blank=True, max_length=200)),
                ('block_name', models.CharField(blank=True, max_length=50)),
                ('cluster_name', models.CharField(blank=True, max_length=50)),
                ('village_name', models.CharField(blank=True, max_length=50)),
                ('pincode', models.IntegerField(blank=True, null=True)),
                ('rural_urban', models.IntegerField(blank=True, null=True)),
                ('medium_of_instruction', models.IntegerField(blank=True, null=True)),
                ('distance_brc', models.FloatField(blank=True, null=True)),
                ('distance_crc', models.FloatField(blank=True, null=True)),
                ('yeur_estd', models.IntegerField(blank=True, null=True)),
                ('pre_pry_yn', models.IntegerField(blank=True, null=True)),
                ('residential_sch_yn', models.IntegerField(blank=True, null=True)),
                ('sch_management', models.IntegerField(blank=True, null=True)),
                ('lowest_class', models.IntegerField(blank=True, null=True)),
                ('highest_class', models.IntegerField(blank=True, null=True)),
                ('sch_category', models.IntegerField(blank=True, null=True)),
                ('pre_pry_students', models.IntegerField(blank=True, null=True)),
                ('school_type', models.IntegerField(blank=True, null=True)),
                ('shift_school_yn', models.IntegerField(blank=True, null=True)),
                ('no_of_working_days', models.IntegerField(blank=True, null=True)),
                ('no_of_acad_inspection', models.IntegerField(blank=True, null=True)),
                ('residential_sch_type', models.IntegerField(blank=True, null=True)),
                ('pre_pry_teachers', models.IntegerField(blank=True, null=True)),
                ('visits_by_brc', models.IntegerField(blank=True, null=True)),
                ('visits_by_crc', models.IntegerField(blank=True, null=True)),
                ('school_dev_grant_recd', models.FloatField(blank=True, null=True)),
                ('school_dev_grant_expnd', models.FloatField(blank=True, null=True)),
                ('tlm_grant_recd', models.FloatField(blank=True, null=True)),
                ('tlm_grant_expnd', models.FloatField(blank=True, null=True)),
                ('funds_from_students_recd', models.FloatField(blank=True, null=True)),
                ('funds_from_students_expnd', models.FloatField(blank=True, null=True)),
                ('building_status', models.IntegerField(blank=True, null=True)),
                ('tot_clrooms', models.IntegerField(blank=True, null=True)),
                ('classrooms_in_good_condition', models.IntegerField(blank=True, null=True)),
                ('classrooms_require_major_repair', models.IntegerField(blank=True, null=True)),
                ('classrooms_require_minor_repair', models.IntegerField(blank=True, null=True)),
                ('other_rooms_in_good_cond', models.IntegerField(blank=True, null=True)),
                ('other_rooms_need_major_rep', models.IntegerField(blank=True, null=True)),
                ('other_rooms_need_minor_rep', models.IntegerField(blank=True, null=True)),
                ('toilet_common', models.IntegerField(blank=True, null=True)),
                ('toilet_boys', models.IntegerField(blank=True, null=True)),
                ('toilet_girls', models.IntegerField(blank=True, null=True)),
                ('kitchen_devices_grant', models.IntegerField(blank=True, null=True)),
                ('status_of_mdm', models.IntegerField(blank=True, null=True)),
                ('computer_aided_learnin_lab', models.IntegerField(blank=True, null=True)),
                ('separate_room_for_headmaster', models.IntegerField(blank=True, null=True)),
                ('electricity', models.IntegerField(blank=True, null=True)),
                ('boundary_wall', models.IntegerField(blank=True, null=True)),
                ('library_yn', models.IntegerField(blank=True, null=True)),
                ('playground', models.IntegerField(blank=True, null=True)),
                ('blackboard', models.IntegerField(blank=True, null=True)),
                ('books_in_library', models.IntegerField(blank=True, null=True)),
                ('drinking_water', models.IntegerField(blank=True, null=True)),
                ('medical_checkup', models.IntegerField(blank=True, null=True)),
                ('ramps', models.IntegerField(blank=True, null=True)),
                ('no_of_computers', models.IntegerField(blank=True, null=True)),
                ('male_tch', models.IntegerField(blank=True, null=True)),
                ('female_tch', models.IntegerField(blank=True, null=True)),
                ('noresp_tch', models.IntegerField(blank=True, null=True)),
                ('head_teacher', models.IntegerField(blank=True, null=True)),
                ('graduate_teachers', models.IntegerField(blank=True, null=True)),
                ('tch_with_professional_qualification', models.IntegerField(blank=True, null=True)),
                ('days_involved_in_non_tch_assgn', models.IntegerField(blank=True, null=True)),
                ('teachers_involved_in_non_tch_assgn', models.IntegerField(blank=True, null=True)),
                ('centroid', django.contrib.gis.db.models.fields.GeometryField(blank=True, null=True, srid=4326)),
                ('assembly_name', models.CharField(blank=True, max_length=35)),
                ('parliament_name', models.CharField(blank=True, max_length=35)),
                ('class1_total_enr_boys', models.IntegerField(blank=True, null=True)),
                ('class2_total_enr_boys', models.IntegerField(blank=True, null=True)),
                ('class3_total_enr_boys', models.IntegerField(blank=True, null=True)),
                ('class4_total_enr_boys', models.IntegerField(blank=True, null=True)),
                ('class5_total_enr_boys', models.IntegerField(blank=True, null=True)),
                ('class6_total_enr_boys', models.IntegerField(blank=True, null=True)),
                ('class7_total_enr_boys', models.IntegerField(blank=True, null=True)),
                ('class8_total_enr_boys', models.IntegerField(blank=True, null=True)),
                ('class1_total_enr_girls', models.IntegerField(blank=True, null=True)),
                ('class2_total_enr_girls', models.IntegerField(blank=True, null=True)),
                ('class3_total_enr_girls', models.IntegerField(blank=True, null=True)),
                ('class4_total_enr_girls', models.IntegerField(blank=True, null=True)),
                ('class5_total_enr_girls', models.IntegerField(blank=True, null=True)),
                ('class6_total_enr_girls', models.IntegerField(blank=True, null=True)),
                ('class7_total_enr_girls', models.IntegerField(blank=True, null=True)),
                ('class8_total_enr_girls', models.IntegerField(blank=True, null=True)),
                ('total_boys', models.IntegerField(blank=True, null=True)),
                ('total_girls', models.IntegerField(blank=True, null=True)),
                ('new_pincode', models.IntegerField(blank=True, null=True)),
                ('infered_assembly', models.CharField(blank=True, max_length=256, null=True)),
                ('infered_parliament', models.CharField(blank=True, max_length=256, null=True)),
                ('academic_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='common.AcademicYear')),
            ],
        ),
    ]