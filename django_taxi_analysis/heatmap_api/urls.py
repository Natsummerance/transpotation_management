from django.urls import path
from .views import (
    HeatmapDataView,
    StatisticsView,
    DashboardDataView,
    VehicleTrajectoryView,
    HotspotsAnalysisView,
    FlowAnalysisView,
    SpatiotemporalAnalysisView,
    VehicleIdListView,
    DistanceDistributionView,
    WeeklyPassengerFlowView,
)

urlpatterns = [
    path('heatmap/', HeatmapDataView.as_view(), name='heatmap_data'),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('dashboard/', DashboardDataView.as_view(), name='dashboard_data'),
    path('trajectory/', VehicleTrajectoryView.as_view(), name='vehicle_trajectory'),
    path('trajectory/vehicles/', VehicleIdListView.as_view(), name='vehicle_id_list'),
    path('hotspots/', HotspotsAnalysisView.as_view(), name='hotspots_analysis'),
    path('flow/', FlowAnalysisView.as_view(), name='flow_analysis'),
    path('spatiotemporal/', SpatiotemporalAnalysisView.as_view(), name='spatiotemporal_analysis'),
    path('distance-distribution/', DistanceDistributionView.as_view(), name='distance_distribution'),
    path('weekly-passenger-flow/', WeeklyPassengerFlowView.as_view(), name='weekly_passenger_flow'),
] 