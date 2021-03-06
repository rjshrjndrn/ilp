import datetime, os, csv
from io import TextIOWrapper
from pprint import pprint
import pdfkit

from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from django.views import View
from django.contrib.postgres.fields.jsonb import KeyTextTransform
from django.db.models import Sum, Count, Case, When
from django.template.loader import render_to_string

from .links import send_link, send_recipient
from .models import Reports, Tracking
from .reportlist import reportlist


# Create your views here.

def view_report(request, report_id, tracking_id='default'):
    try:
        report = Reports.objects.get(link_id=report_id)
        data = report.data
    except Reports.DoesNotExist:
        return render(request, 'reports/not_found.html', context={'data': report_id})

    try:
        tracker = Tracking.objects.get(track_id=tracking_id, report_id__link_id=report_id)
        tracker.visit_count += 1
        tracker.visited_at = datetime.datetime.now()
        tracker.save()
    except Tracking.DoesNotExist:
        pass

    if request.GET.get('lang') == 'english':
        return render(request, 'reports/{}.html'.format(report.report_type), context={'data':data})
    else:
        return render(request, 'reports/{}kannada.html'.format(report.report_type), context={'data':data})

def download_report(request, report_id, tracking_id='default'):
    try:
        report_model = Reports.objects.get(link_id=report_id)
    except Reports.DoesNotExist:
        return render(request, 'reports/not_found.html', context={'data': report_id})

    report = reportlist[report_model.report_type](data=report_model.data)
    pdf = report.get_pdf(lang=request.GET.get('lang'))
    filename = report_model.report_type+datetime.datetime.now().strftime("%d%m%y")+'.pdf'

    try:
        tracker = Tracking.objects.get(track_id=tracking_id, report_id__link_id=report_id)
        tracker.download_count += 1
        tracker.downloaded_at = datetime.datetime.now()
        tracker.save()
    except Tracking.DoesNotExist:
        pass

    response = HttpResponse(pdf, content_type="application/pdf")
    response['Content-Disposition'] = 'inline; filename=' + filename
    return response

def download_analytics(request ):
    template = 'reports/report_analytics_summary.html'
    data_from = request.GET.get('from')
    data_to = request.GET.get('to')
    messages = []
    successfull=True
    reports = Reports.objects.filter(data__today__range=[data_from, data_to])
    data = {'district_level':getDistrictLevel(reports),
            'block_level':getBlockLevel(reports),
            'cluster_level':getClusterLevel(reports),
            'top_summary':getTopSummary(reports),
            'by_user':getByReportType(reports)
    }
    html = render_to_string(template, {'data':data})
    config = pdfkit.configuration()
    pdf = pdfkit.PDFKit(html, 'string', configuration=config).to_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response['Content-Disposition'] = 'inline; filename=' + 'REPORTANALYTICS.pdf'
    return response

class SendReport(View):
    def get(self,request):
        return render(request, 'reports/send_report.html', context={'reports':reportlist})

    def post(self,request):
        report_type = request.POST.get('report_type')
        report_from = request.POST.get('from')
        report_to = request.POST.get('to')
        dry = request.POST.get('dry_run')
        print(dry)
        recipients = TextIOWrapper(request.FILES['recipients'].file, encoding=request.encoding)
        reader = csv.reader(recipients)

        res= send_recipient(report_type, report_from, report_to, reader, dry)
        
        return render(request, 'reports/report_summary.html', context={'messages':res['messages'], 'success':res['successfull']})

    def getValue(self, person, head, i):

        index = head.index(i)
        value = person[index]
        return value

class ReportAnalytics(View):
    def get(self,request):
        if request.GET.get('from') and request.GET.get('to') :
            data_from = request.GET.get('from')
            data_to = request.GET.get('to')
            messages = []
            successfull=True
            reports = Reports.objects.filter(data__today__range=[data_from, data_to])
            trackings = Tracking.objects.filter(created_at__range=[data_from, data_to])
            data = {'district_level':getDistrictLevel(reports),
                    'block_level':getBlockLevel(reports),
                    'cluster_level':getClusterLevel(reports),
                    'top_summary':getTopSummary(reports),
                    'by_type':getByReportType(reports),
                    'by_user':getByUser(trackings)
            }
            
            return render(request, 'reports/report_analytics_summary.html', context={'messages':messages, 'success':successfull,'data':data})
        else:
            return render(request, 'reports/report_analytics.html', context={'reports':reportlist})
    
    def getValue(self, person, head, i):

        index = head.index(i)
        value = person[index]
        return value

def getDistrictLevel(reports):
    districtreport = reports.filter(report_type='DistrictReport').annotate(district_name=KeyTextTransform('district_name', 'parameters'))
    districts = districtreport.values_list('district_name', flat=True).distinct() # Get district names
    ##for cluster replace district_name with cluster_name and similarly for block and others
    count = []
    for district in districts:
        c = districtreport.filter(district_name=district)
        sent = c.count()
        visit = c.aggregate(sum=Sum('tracking__visit_count'))['sum']
        read = c.aggregate(read_unique = Count(Case(When(tracking__visit_count__gt=0, then=1))))['read_unique']
        download = c.aggregate(sum=Sum('tracking__download_count'))['sum']
        count.append(dict(sent=sent, read=read, visit=visit, download=download,district=district))
    return count

def getBlockLevel(reports):
    blockreport = reports.filter(report_type='BlockReport').annotate(district_name=KeyTextTransform('district_name', 'parameters'),
                                                                     block_name=KeyTextTransform('block_name', 'parameters'))
    districts = blockreport.values_list('district_name', flat=True).distinct() # Get district names
    count = []
    for district in districts:
        c = blockreport.filter(district_name=district)
        block_num =  c.values_list('block_name', flat=True).distinct().count() # Get district names
        sent = c.count()
        visit = c.aggregate(sum=Sum('tracking__visit_count'))['sum']
        read = c.aggregate(read_unique = Count(Case(When(tracking__visit_count__gt=0, then=1))))['read_unique']
        download = c.aggregate(sum=Sum('tracking__download_count'))['sum']
        count.append(dict(sent=sent, read=read, visit=visit, download=download,district=district,block_num=block_num))   
    return count

def getClusterLevel(reports):
    clusterreport = reports.filter(report_type='ClusterReport').annotate(cluster_name=KeyTextTransform('cluster_name', 'parameters'),
                                                                         block_name=KeyTextTransform('block_name', 'parameters'))
    blocks = clusterreport.values_list('block_name', flat=True).distinct() 
    count = []
    for block in blocks:
        c = clusterreport.filter(block_name=block)
        cluster_num =  c.values_list('cluster_name', flat=True).distinct().count() 
        sent = c.count()
        visit = c.aggregate(sum=Sum('tracking__visit_count'))['sum']
        read = c.aggregate(read_unique = Count(Case(When(tracking__visit_count__gt=0, then=1))))['read_unique']
        download = c.aggregate(sum=Sum('tracking__download_count'))['sum']
        count.append(dict(sent=sent, read=read, visit=visit, download=download,block=block,cluster_num=cluster_num))  
    return count

def getTopSummary(reports):
    sent = reports.count()
    visit = reports.aggregate(sum=Sum('tracking__visit_count'))['sum']
    read = reports.aggregate(read_unique = Count(Case(When(tracking__visit_count__gt=0, then=1))))['read_unique']
    download = reports.aggregate(sum=Sum('tracking__download_count'))['sum']
    return dict(sent=sent, read=read, visit=visit, download=download)

def getByReportType(reports):
    district_report = reports.filter(report_type='DistrictReport')
    block_report = reports.filter(report_type='BlockReport')
    clusterreport = reports.filter(report_type='ClusterReport')
    school_report = reports.filter(report_type='SchoolReport')
    gp_report = reports.filter(report_type='GPMathContestReport')

    district = getTopSummary(district_report)
    block = getTopSummary(block_report)
    cluster = getTopSummary(clusterreport)
    school = getTopSummary(school_report)
    gp = getTopSummary(gp_report)

    return dict(district=district, block=block, cluster=cluster, school=school, gp=gp)

def getByUser(trackings):
    
    beo =  trackings.filter(role='BEO')
    brp = trackings.filter(role='BRP')
    ddpi = trackings.filter(role='DDPI')
    diet = trackings.filter(role='DIET')
    crps = trackings.filter(role='CRPS')
    hms = trackings.filter(role='HMS')
    staff = trackings.filter(role='AKSHARA STAFF')
    
    return dict(beo=getSentData(beo), brp=getSentData(brp), ddpi=getSentData(ddpi), diet=getSentData(diet),
                       crps=getSentData(crps), hms=getSentData(hms), staff = getSentData(staff))

def getSentData(trackings):
    sent = trackings.count()
    visit = trackings.aggregate(sum=Sum('visit_count'))['sum']
    read = trackings.aggregate(read_unique = Count(Case(When(visit_count__gt=0, then=1))))['read_unique']
    download = trackings.aggregate(sum=Sum('download_count'))['sum']
    return dict(sent=sent, read=read, visit=visit, download=download)
