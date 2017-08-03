\set electionboundary :outputdir '/electionboundary.csv'
\set electionboundneighbours :outputdir '/electboundneighbours.csv'
COPY(SELECT id, 
    CASE
        when dise_slug IS NULL THEN ''
        ELSE dise_slug
    END as dise_slug,
    elec_comm_code,
    const_ward_name,
    CASE
        WHEN const_ward_type='MLA Constituency' THEN 'ML'
        WHEN const_ward_type='Ward' THEN 'MW'
        WHEN const_ward_type='MP Constituency' THEN 'MP'
        WHEN const_ward_type='Centre' THEN 'C'
        WHEN const_ward_type='State' THEN 'ST'
        WHEN const_ward_type='City Corporation' THEN 'MW'
        WHEN const_ward_type='District' THEN 'SD'
        WHEN const_ward_type='Gram Panchayat' THEN 'GP'
    END AS ward_type,
    current_elected_rep,
    CASE 
        WHEN (lower(current_elected_party)='bharatiya janata party' OR lower(current_elected_party)='bjp') THEN 'BJP'
        WHEN lower(current_elected_party)='independent' THEN 'I'
        WHEN lower(current_elected_party)='karnataka jantha paksha' THEN 'KJP'
        WHEN lower(current_elected_party)='others' THEN 'O'
        WHEN (lower(current_elected_party)='indian national congress' OR lower(current_elected_party)='inc') THEN 'INC'
        WHEN (lower(current_elected_party)='janata dal (secular)' OR lower(current_elected_party)='jds' OR lower(current_elected_party)='jd(s)') THEN 'JD(S)'
        WHEN lower(current_elected_party)='badavara shramikara raitara congress party' THEN 'BSRCP'
        WHEN (lower(current_elected_party)='samajwadi party' OR lower(current_elected_party)='sp') THEN 'SP'
        WHEN lower(current_elected_party)='sarvodaya karnataka paksha' THEN 'SKP'
        WHEN lower(current_elected_party)='karnataka makkala paksha' THEN 'KMP'
    END AS current_elected_party,
    2 as state,
    CASE
        WHEN status='active' THEN 'AC'
        WHEN status='inactive' THEN 'IA'
    END AS status
 FROM tb_electedrep_master) TO :'electionboundary' CSV HEADER DELIMITER ',';

 COPY(SELECT t1.id, t2.neighbours FROM tb_electedrep_master t1 CROSS JOIN LATERAL unnest(string_to_array(t1.neighbours, '|')) AS t2 (neighbours)) TO :'electionboundneighbours' CSV HEADER DELIMITER ',';