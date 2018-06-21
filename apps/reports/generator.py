import sys
import csv
import django_filters

from reports.reports import ReportOne, GPMathContestReport
from .reportlist import reportlist
from .links import send_recipient


def generate_report_internal(report_type, filepath, report_from, report_to, dry):
    try:
        r = reportlist[report_type]
        with open(filepath, 'rt') as f:
            reader = csv.reader(f)
            messages = send_recipient(report_type, report_from, report_to, reader, dry)
            for m in messages:
                print(m)
        print('success')
    except KeyError:
        sys.stderr.write("{} is not a valid report type\n".format(report_type))
        raise
    except ValueError :
        sys.stderr.write("Error in Report generation\n")
        raise

def generate_report(report_type, filename, report_from, report_to, dry):
    try:
        rid = generate_report_internal(report_type, filename, report_from, report_to, dry)
        print ("Report created. Id is {} \n".format(rid))

    except (KeyError, ValueError) as e:
        sys.exit(-2)
