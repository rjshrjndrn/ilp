#!/bin/sh
# Call this script with the database name
if [ $# -eq 0 ]; then
    echo "Please supply database names as argument. USAGE: `basename $0` klpdbname electedrepdbname newdatabasename pathtostorecsvs"
    exit 1;
fi
echo "######################"
echo "STARTING SCRIPT - POPULATE BOUNDARY TABLES"
echo "######################"
legacydb="$1";
ilpdbname="$3";
electedrepdbname="$2"
csvdirname="$4";

#Delete from tables
psql -U klp -d $ilpdbname -f sql/deleteFromTables.sql

#Add entries for India and Karnataka in the boundary table. Need to add more states here as we go along
psql -U klp -d $ilpdbname -f sql/fillBoundaryStatics.sql

#Export the boundary table data
psql -U klp -d $legacydb --set=outputdir="$csvdirname" -f sql/exportBoundaryData.sql

#Import the boundary table data
psql -U klp -d $ilpdbname --set=inputdir="$csvdirname" -f sql/importBoundaryTable.sql
exit_status=$?
if [ $exit_status -eq 1 ]; then
    echo "SQL script execution failed with error";
    exit $exit_status;
fi

#Populate the boundary neighbors table
python loadBoundaryNeighbors.py $ilpdbname
exit_status=$?
if [ $exit_status -eq 1 ]; then
    echo "Python script execution failed with error";
    exit $exit_status;
fi

#Export the election boundary data from electrep_new DB
psql -U klp -d $electedrepdbname --set=outputdir="$csvdirname" -f sql/exportElectionBoundary.sql

#Import the election boundary data from the CSV into boundary_electionboundary table
psql -U klp -d $ilpdbname --set=inputdir="$csvdirname" -f sql/importElectionBoundary.sql
exit_status=$?
if [ $exit_status -eq 1 ]; then
    echo "SQL script execution failed with error";
    exit $exit_status;
fi
echo "Script executed successfully";
echo "######################"
echo "ENDING SCRIPT - POPULATE BOUNDARY TABLES"
echo "######################"