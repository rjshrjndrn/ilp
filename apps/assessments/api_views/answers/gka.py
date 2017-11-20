from django.db.models import Q
from django.db.models import Count
from django.contrib.auth.models import Group

from assessments.models import (
    AnswerGroup_Institution, Survey, AnswerInstitution,
    Question, AnswerGroup_Student
)
from schools.models import Institution
from boundary.models import Boundary, BoundaryType

GKA_DISTRICTS = [433, 439, 441, 425, 421, 420]
# bangalore rural, chamarajanagar, chikkaballapura,
# chitradurga, dharwad, gadag


class GKA(object):

    neighbourIds = {
        413: [414, 415, 420, 421, 422],
        414: [413, 415, 418, 419, 420],
        415: [413, 414, 416, 418, 445],
        416: [415, 417, 445],
        417: [416],
        418: [414, 415, 419, 424, 445],
        419: [414, 418, 420, 424],
        420: [414, 419, 421, 423, 424],
        421: [413, 420, 422, 423],
        422: [413, 421, 423, 427, 428],
        423: [420, 421, 422, 424, 426, 427],
        424: [418, 419, 420, 423, 426, 425],
        425: [424, 426, 429, 430],
        426: [423, 424, 425, 427, 429],
        427: [422, 423, 426, 428, 429],
        428: [422, 427, 429, 436],
        429: [425, 426, 427, 428, 430, 435, 436],
        430: [425, 429, 433, 434, 435, 441, 444],
        431: [433, 441, 9540, 9541],
        433: [430, 431, 444, 9540, 9541],
        434: [430, 435, 439, 444, 8878],
        435: [429, 430, 434, 436, 437, 8878],
        436: [428, 429, 435, 437],
        437: [435, 436, 8878],
        439: [434, 444, 8878],
        441: [430, 431, 433],
        442: [414, 415, 420, 421, 422],
        443: [425, 429, 433, 434, 435, 441, 444],
        444: [430, 433, 434, 439, 9540, 9541],
        445: [415, 416, 418],
        8878: [434, 435, 437, 439],
        9540: [431, 433, 444, 9541],
        9541: [431, 433, 444, 9540],
    }

    def __init__(self, start_date, end_date):
        self.agroup_inst_ids = \
            AnswerGroup_Institution.objects.values('id')
        # Need clarification on access_uid
        # self.assessments = AnswerGroup_Student.objects.values('assess_uid')
        self.agroup_stud_ids = AnswerGroup_Student.objects.values('id')

        if start_date:
            self.agroup_inst_ids = self.agroup_inst_ids.filter(
                date_of_visit__gte=start_date,
            )
            self.agroup_stud_ids = self.agroup_stud_ids.filter(
                date_of_visit__gte=start_date,
            )
        if end_date:
            self.agroup_inst_ids = self.agroup_inst_ids.filter(
                date_of_visit__lte=end_date,
            )
            self.agroup_stud_ids = self.agroup_stud_ids.filter(
                date_of_visit__lte=end_date,
            )

        survey = Survey.objects.get(name="GP Contest")
        questiongroups = survey.questiongroup_set.all()
        self.gp_contest_insts = self.agroup_inst_ids.filter(
            questiongroup__in=questiongroups,
        )
        self.gp_contest_insts = self.gp_contest_insts.values_list(
            'institution', flat=True).distinct('institution')

    def generate_boundary_summary(self, boundary, chosen_boundary):
        # todo
        # government_crps = Group.objects.get(name="CRP").user_set.all()
        summary = {}

        if boundary == chosen_boundary:
            summary['chosen'] = True
        else:
            summary['chosen'] = False

        boundary_insts = Institution.objects.filter(
            Q(admin1=boundary) | Q(admin2=boundary) | Q(admin3=boundary)
        ).values_list('id', flat=True)

        summary['boundary_name'] = boundary.name
        summary['boundary_type'] = boundary.boundary_type.name
        summary['schools'] = boundary_insts.count()
        summary['sms'] = self.agroup_inst_ids.filter(
            questiongroup__source__name='sms',
            institution_id__in=boundary_insts
        ).count()
        summary['sms_govt'] = self.agroup_inst_ids.filter(
            questiongroup__source__name='sms',
            institution_id__in=boundary_insts
            # todo
            # user__in=government_crps
        ).count()
        summary['assessments'] = self.agroup_stud_ids.filter(
            Q(student__institution__admin1__name=boundary.name) |
            Q(student__institution__admin2__name=boundary.name) |
            Q(student__institution__admin3__name=boundary.name)
        ).count()

        summary['contests'] = boundary_insts.filter(
            id__in=self.gp_contest_insts
        ).aggregate(
            gp_count=Count('gp', distinct=True)
        )['gp_count']

        question_groups = Survey.objects.get(
            name="ILP Konnect Community Survey"
        ).questiongroup_set.filter(
            source__name="csv"
        )

        summary['surveys'] = self.agroup_inst_ids.filter(
            questiongroup__in=question_groups,
            institution__in=boundary_insts,
        ).count()

        return summary

    def get_hierarchy_summary(self, chosen_inst=None, chosen_boundary=None):
        hierarchy_summaries = []
        if chosen_inst:
            chosen_boundary = chosen_inst.admin3

        boundary = chosen_boundary
        boundaries = [boundary, ]
        while boundary.boundary_type.char_id != BoundaryType.SCHOOL_DISTRICT:
            boundaries.append(boundary.parent)
            boundary = boundary.parent

        for boundary in boundaries:
            summary = self.generate_boundary_summary(boundary, chosen_boundary)
            hierarchy_summaries.append(summary)

        return hierarchy_summaries

    def get_neighbour_summary(self, chosen_boundary):
        neighbour_summaries = []
        if chosen_boundary == 'GKA':
            neighbour_ids = GKA_DISTRICTS
            chosen_boundary = Boundary.objects.get(id=GKA_DISTRICTS[0])
        else:
            neighbour_ids = self.neighbourIds[chosen_boundary.id] +\
                [chosen_boundary.id]

        neighbours = Boundary.objects.filter(id__in=neighbour_ids)

        for neighbour in neighbours:
            summary = self.generate_boundary_summary(
                neighbour, chosen_boundary)
            neighbour_summaries.append(summary)

        return neighbour_summaries

    def get_summary_comparison(self, chosen_boundary, chosen_inst):
        summary = {}
        btype = BoundaryType.objects.get(char_id=BoundaryType.SCHOOL_DISTRICT)
        districts = Boundary.objects.filter(boundary_type=btype)

        if chosen_inst:
            summary = self.get_hierarchy_summary(
                chosen_inst=chosen_inst)
        elif (chosen_boundary == 'GKA' or
              chosen_boundary.hierarchy in districts):
            summary = self.get_neighbour_summary(
                chosen_boundary=chosen_boundary)
        else:
            summary = self.get_hierarchy_summary(
                chosen_boundary=chosen_boundary)

        return summary

    def generate_boundary_competency(self, boundary, chosen_boundary):
        gp_contest = {}
        ekstep = {}
        
        if boundary == chosen_boundary:
            gp_contest['chosen'] = True
            ekstep['chosen'] = True
        else:
            gp_contest['chosen'] = False
            ekstep['chosen'] = False

        boundary_insts = Institution.objects.filter(
            Q(admin1=boundary) | Q(admin2=boundary) | Q(admin3=boundary)
        ).values_list('id', flat=True)

        gp_contest['boundary_name'] = boundary.name
        gp_contest['boundary_type'] = boundary.boundary_type.name
        gp_contest['type'] = 'gp_contest'

        ekstep['boundary_name'] = boundary.name
        ekstep['boundary_type'] = boundary.boundary_type.name
        ekstep['type'] = 'ekstep'

        # GP Contest
        survey = Survey.objects.get(name="GP Contest")
        questiongroups = survey.questiongroup_set.all()
        agroup_inst_ids = self.agroup_inst_ids.filter(
            questiongroup__in=questiongroups,
            institution_id__in=boundary_insts
        )

        answers = AnswerInstitution.objects.filter(
            answergroup__in=agroup_inst_ids)
        answer_counts = answers.values(
            'question', 'answer').annotate(Count('answer'))

        competencies = {}

        for entry in answer_counts:
            question_id = entry['question']
            question_text = Question.objects.only(
                'question_text').get(id=question_id).question_text
            answer_text = entry['answer']
            answer_count = entry['answer__count']
            if question_text not in competencies:
                competencies[question_text] = {}
            competencies[question_text][answer_text] = answer_count

        gp_contest['competencies'] = competencies
        
        # EkStep
        # assessments = self.assessments.filter(
        #     Q(student_uid__district=boundary.name) |
        #     Q(student_uid__block=boundary.name) |
        #     Q(student_uid__cluster=boundary.name)
        # )
        # ekstep_class = EkStepGKA()
        # ekstep['competencies'] = ekstep_class.get_scores(assessments)

        return gp_contest, ekstep

    def get_hierarchy_competency(
        self, chosen_school=None, chosen_boundary=None
    ):

        hierarchy_competencies = []
        if chosen_school:
            chosen_boundary = chosen_school.admin3

        boundary = chosen_boundary
        boundaries = [boundary, ]
        while boundary.boundary_type.char_id != BoundaryType.SCHOOL_DISTRICT:
            boundaries.append(boundary.parent)
            boundary = boundary.parent

        for boundary in boundaries:
            competency = self.generate_boundary_competency(
                boundary, chosen_boundary)
            hierarchy_competencies.append(competency)

        return hierarchy_competencies

    def get_neighbour_competency(self, chosen_boundary):
        neighbour_competencies = []
        if chosen_boundary == 'GKA':
            neighbour_ids = GKA_DISTRICTS
            chosen_boundary = Boundary.objects.get(id=GKA_DISTRICTS[0])
        else:
            neighbour_ids = \
                self.neighbourIds[chosen_boundary.id] + [chosen_boundary.id]

        neighbours = Boundary.objects.filter(id__in=neighbour_ids)

        for neighbour in neighbours:
            competency = self.generate_boundary_competency(
                neighbour, chosen_boundary)
            neighbour_competencies.append(competency)

        return neighbour_competencies

    def get_competency_comparison(self, chosen_boundary, chosen_school):
        summary = {}
        btype = BoundaryType.objects.get(char_id=BoundaryType.SCHOOL_DISTRICT)
        districts = Boundary.objects.filter(boundary_type=btype)

        if chosen_school:
            summary = self.get_hierarchy_competency(
                chosen_school=chosen_school)
        elif (chosen_boundary == 'GKA' or
              chosen_boundary.hierarchy in districts):
            summary = self.get_neighbour_competency(
                chosen_boundary=chosen_boundary)
        else:
            summary = self.get_hierarchy_competency(
                chosen_boundary=chosen_boundary)
        return summary

    def generate_report(self, chosen_boundary, chosen_inst):
        response = {}
        response['summary_comparison'] = {}
        response['competency_comparison'] = {}

        if chosen_inst:
            chosen_boundary = chosen_inst.admin3
        elif not chosen_boundary:
            chosen_boundary = 'GKA'

        response['competency_comparison'] = self.get_competency_comparison(
            chosen_boundary, chosen_inst)
        response['summary_comparison'] = self.get_summary_comparison(
            chosen_boundary, chosen_inst)
        return response
