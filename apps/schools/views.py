from common.views import StaticPageView
from django.views.generic.detail import DetailView
from django.http import HttpResponseRedirect, Http404
from django.urls import reverse

from boundary.models import Boundary

from schools.models import Institution

class AdvancedMapView(StaticPageView):
    template_name = 'advanced_map.html'
    extra_context = {
        'hide_footer': True,
    }

class BoundaryPageView(DetailView):
    model = Boundary
    template_name = 'boundary.html'

    def get(self, request, **kwargs):
        queryset = self.get_queryset()

        pk = self.kwargs.get('pk')
        boundary = queryset.get(pk=pk)

        entity_type = ''
        if boundary.boundary_type_id in ('SD', 'PD'):
            entity_type = '-district'
            if boundary.type_id == 'primary':
                entity_type = 'primary' + entity_type
            elif boundary.type_id == 'pre':
                entity_type = 'preschool' + entity_type
        elif boundary.boundary_type_id == 'SB':
            entity_type = 'block'
        elif boundary.boundary_type_id == 'SC':
            entity_type = 'cluster'
        elif boundary.boundary_type_id == 'PP':
            entity_type = 'project'
        elif boundary.boundary_type_id == 'PC':
            entity_type = 'circle'
        verbose_url = reverse('boundary_page_new', kwargs={
            'boundary_type': entity_type,
            'pk': boundary.id
        })

        return HttpResponseRedirect(verbose_url)


class NewBoundaryPageView(DetailView):
    model = Boundary
    template_name = 'boundary.html'

    def get_object(self, queryset=None):
        if queryset is None:
            queryset = self.get_queryset()

        pk = self.kwargs.get('pk')
        boundary_type = self.kwargs.get('boundary_type')

        if boundary_type in ['preschool-district', 'circle', 'project']:
            queryset = queryset.filter(type_id='pre')
        elif boundary_type in ['primary-district', 'cluster', 'block']:
            queryset = queryset.filter(type_id='primary')

        try:
            boundary = queryset.get(
                id=pk,
                hierarchy__name=boundary_type.replace('preschool-', '').replace('primary-', '')
            )
            return boundary
        except self.model.DoesNotExist:
            raise Http404


class SchoolPageView(DetailView):
    model = Institution
    template_name = 'school.html'

    def get_context_data(self, **kwargs):
        # Call the base implementation first to get a context
        context = super(SchoolPageView, self).get_context_data(**kwargs)
        # Add in a QuerySet of all the books
        school = context['object']
        print("School object is: ", school.__dict__)
        # FIXME: there really should be a better way of handling school / preschool
        # Ideally, this would be better naming of "Boundary Type" and then just use that
        school_type = school.institution_type_id
        context['breadcrumbs'] = [
            {
                'url': reverse('map'),
                'name': 'Map'
            },
            {
                'url': reverse('school_page', kwargs={'pk': school.id}),
                'name': '%s: %s' % (school_type, school.name,)
            }
        ]
        return context