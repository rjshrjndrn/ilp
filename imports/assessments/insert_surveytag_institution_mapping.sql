insert into assessments_surveytaginstitutionmapping (tag_id, academic_year_id, institution_id) select 'gka', '1617', s.id from schools_institution s where s.admin1_id in (424,417,416,419,418,445);
insert into assessments_surveytaginstitutionmapping (tag_id, academic_year_id, institution_id) select 'gka', '1718', s.id from schools_institution s where s.admin1_id in (424,417,416,419,418,445,433,439,441,425,421,420);
