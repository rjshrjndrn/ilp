from rest_framework.test import APITestCase, APIClient
from rest_framework.test import APIRequestFactory
from rest_framework.test import force_authenticate
from rest_framework import status
import json
import base64
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.management import call_command
from tests import IlpTestCase
from boundary.api_views import (BoundaryViewSet)
from boundary.models import Boundary, BoundaryType
from common.models import Status, InstitutionType


class BoundaryApiTests(APITestCase):

    '''setupTestData is invoked in the parent class which sets up fixtures just once for all the tests.
    So this test case should essentially be just reads/fetches. If we require a pristine DB each time for
    writes, please write another class '''

    @classmethod
    def setUpTestData(self):
        #Load fixtures
        print("loading fixtures")
        call_command('loaddata', 'apps/boundary/tests/test_fixtures/common', 
                     verbosity=0)
        call_command('loaddata', 'apps/boundary/tests/test_fixtures/test_boundary', 
                     verbosity=0)
        '''This is a custom django admin command created under boundary/
         management/commands.
        It can be used to create more matviews by modifying the py file '''
        call_command('creatematviews', verbosity=0)

    def setUp(self):
        #setup a test user
        self.user = get_user_model().objects.create_user('admin', 'admin@klp.org.in', 'admin')
        self.listView = BoundaryViewSet.as_view(actions={'get': 'list'})
        self.detailView = BoundaryViewSet.as_view(actions={'get': 'retrieve'})
        self.createView = BoundaryViewSet.as_view(actions={'post': 'create'})
        self.updateView = BoundaryViewSet.as_view(actions={'patch': 'partial_update', 'put': 'update', 'delete': 'destroy'})
        self.factory = APIRequestFactory()
    
    def test_boundary_list(self):
        url = reverse('boundary-list')
        request = self.factory.get(url, {'state': 'ka'})
        force_authenticate(request, user=self.user)
        response = self.listView(request)
        response.render()
        data = response.data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(data)
    
    def test_boundary_detail(self):
        url = reverse('boundary-detail', kwargs={'pk': '414'})
        request = self.factory.get(url, {'state': 'ka'})
        force_authenticate(request, user=self.user)
        response = self.detailView(request, pk=414)
        response.render()
        data = response.data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            set(['id', 'name', 'parent', 'dise_slug','boundary_type', 'type', 'status']).issubset(response.data.keys())
        )
        self.assertIsNotNone(data)
    
    def test_boundary_primary_only(self):
        url = reverse('boundary-list')
        request = self.factory.get(url, {'state': 'ka', 'type': 'primary'})
        force_authenticate(request, user=self.user)
        response = self.listView(request)
        response.render()
        data = response.data
        for boundary in data['results']:
            self.assertEqual(boundary['type'], 'primary')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(data)

    def test_boundary_pre_only(self):
        url = reverse('boundary-list')
        request = self.factory.get(url, {'state': 'ka', 'type': 'pre'})
        force_authenticate(request, user=self.user)
        response = self.listView(request)
        response.render()
        data = response.data
        for boundary in data['results']:
            self.assertEqual(boundary['type'], 'pre')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(data)

    def test_boundary_pd_only(self):
        url = reverse('boundary-list')
        request = self.factory.get(url, {'state': 'ka', 'boundary_type': 'PD'})
        force_authenticate(request, user=self.user)
        response = self.listView(request)
        response.render()
        data = response.data
        for boundary in data['results']:
            self.assertEqual(boundary['boundary_type'], 'PD')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(data['count']>0)
        self.assertIsNotNone(data)
    
    def test_boundary_sb_only(self):
        url = reverse('boundary-list')
        request = self.factory.get(url, {'state': 'ka', 'boundary_type': 'SB'})
        force_authenticate(request, user=self.user)
        response = self.listView(request)
        response.render()
        data = response.data
        for boundary in data['results']:
            self.assertEqual(boundary['boundary_type'], 'SB')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(data['count']>0)
        self.assertIsNotNone(data)

    def test_boundary_create(self):
        #request = factory.post('/notes/', {'title': 'new idea'}, format='json')
        request = self.factory.post('/boundaries', {'parent': '2', 'name': 'test_SD', 'boundary_type': 'SD',
        'type': 'primary','status': 'AC'}, format='json')
        response = self.createView(request)
        response.render()
        data = response.data
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            set(['id', 'name', 'parent', 'dise_slug','boundary_type', 'type', 'status']).issubset(response.data.keys())
        )
        self.assertEqual(data['name'], 'test_SD')
        self.assertEqual(data['boundary_type'], 'SD')

    def test_boundary_partial_update(self):
        # Create the boundary first
        request = self.factory.post('/boundaries', {'parent': '2', 'name': 'test_SD_Update', 'boundary_type': 'SD',
        'type': 'primary','status': 'AC'}, format='json')
        response = self.createView(request)
        response.render()
        data = response.data
        id = data['id']
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Now update the boundary
        request = self.factory.patch('/boundaries/'+ str(id), {'name': 'test_updated_name'}, format='json')
        response = self.updateView(request, pk=id)
        response.render()
        data = response.data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data['name'], 'test_updated_name')

    def test_boundary_update(self):
        # Create the boundary first
        request = self.factory.post('/boundaries', {'parent': '2', 'name': 'test_SD_Update2', 'boundary_type': 'SD',
        'type': 'primary','status': 'AC'}, format='json')
        response = self.createView(request)
        response.render()
        data = response.data
        id = data['id']
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Now update the boundary
        request = self.factory.put('/boundaries/' + str(id), {'name': 'test_SD_Update2', 'parent': '2', 'boundary_type': 'PD','type': 'pre', 'status': 'AC'}, format='json')
        response = self.updateView(request, pk=id)
        response.render()
        data = response.data
        print(data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data['name'], 'test_SD_Update2')

    # def test_boundary_delete(self):
    #     # Create the boundary first
    #     request = self.factory.post('/boundaries', {'parent': '2', 'name': 'test_SD_delete', 'boundary_type': 'SD',
    #     'type': 'primary','status': 'AC'}, format='json')
    #     response = self.createView(request)
    #     response.render()
    #     data = response.data
    #     id = data['id']
    #     self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    #     # Now update the boundary
    #     request = self.factory.delete('/boundaries/' + str(id))
    #     response = self.updateView(request, pk=id)
    #     response.render()
    #     data = response.data
    #     print(response.status_code)
    #     self.assertEqual(response.status_code, status.HTTP_201_CREATED)

