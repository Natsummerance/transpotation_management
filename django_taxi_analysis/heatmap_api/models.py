from django.db import models

# Create your models here.

class TaxiGPSLog(models.Model):
    """出租车GPS日志模型"""
    id = models.BigAutoField(primary_key=True)
    car_plate = models.CharField(max_length=32, verbose_name='车牌号')
    beijing_time = models.DateTimeField(verbose_name='北京时间')
    gcj02_lat = models.FloatField(verbose_name='GCJ02纬度')
    gcj02_lon = models.FloatField(verbose_name='GCJ02经度')
    heading = models.SmallIntegerField(null=True, blank=True, verbose_name='方向')
    is_occupied = models.BooleanField(null=True, blank=True, verbose_name='是否载客')
    event_tag = models.SmallIntegerField(null=True, blank=True, verbose_name='事件标签')
    trip_id = models.IntegerField(null=True, blank=True, verbose_name='行程ID')
    speed = models.FloatField(null=True, blank=True, verbose_name='速度')

    class Meta:
        db_table = 'taxi_gps_log'
        managed = False  # 告诉Django不要管理这个表
        verbose_name = '出租车GPS日志'
        verbose_name_plural = '出租车GPS日志'
        indexes = [
            models.Index(fields=['beijing_time']),
            models.Index(fields=['event_tag']),
            models.Index(fields=['is_occupied']),
            models.Index(fields=['gcj02_lat', 'gcj02_lon']),
        ]

    def __str__(self):
        return f"{self.car_plate} - {self.beijing_time}"

    @property
    def is_pickup(self):
        """是否为上客事件"""
        return self.event_tag == 1

    @property
    def is_dropoff(self):
        """是否为下客事件"""
        return self.event_tag == 2
