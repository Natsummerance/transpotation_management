from rest_framework import serializers
from .models import TaxiGPSLog

class TaxiGPSLogSerializer(serializers.ModelSerializer):
    """出租车GPS日志序列化器"""
    class Meta:
        model = TaxiGPSLog
        fields = ['id', 'car_plate', 'beijing_time', 'gcj02_lat', 'gcj02_lon', 
                 'heading', 'is_occupied', 'event_tag', 'trip_id', 'speed']

class HeatmapPointSerializer(serializers.Serializer):
    """热力图点数据序列化器"""
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    count = serializers.IntegerField()
    time_range = serializers.CharField()

class HeatmapDataSerializer(serializers.Serializer):
    """热力图数据序列化器"""
    points = HeatmapPointSerializer(many=True)
    total_count = serializers.IntegerField()
    time_range = serializers.CharField()
    event_type = serializers.CharField() 