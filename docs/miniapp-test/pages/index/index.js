Page({
  data: {
    wgs84: { lat: '--', lng: '--', accuracy: '--', speed: '--', altitude: '--' },
    gcj02: { lat: '--', lng: '--' },
    address: { name: '--', address: '--' },
    mockInfo: { isMock: false, message: '未获取定位' },
    lastUpdate: '--',
    loading: false
  },

  onLoad() {
    this.getLocation();
  },

  // 获取定位（核心方法）
  getLocation() {
    const that = this;
    this.setData({ loading: true, lastUpdate: '正在请求定位...' });

    // Two independent WeChat API calls. These results need not share a provider or timestamp.
    // 先获取 WGS84
    wx.getLocation({
      type: 'wgs84',
      isHighAccuracy: true,
      highAccuracyExpireTime: 5000,
      success(res) {
        console.log('=== WGS84 原始坐标 ===');
        console.log('纬度:', res.latitude);
        console.log('经度:', res.longitude);
        console.log('定位源:', res.provider || '未提供');
        console.log('精度:', res.accuracy, '米');
        console.log('速度:', res.speed, 'm/s');
        console.log('高度:', res.altitude);
        console.log('垂直精度:', res.verticalAccuracy);
        console.log('水平精度:', res.horizontalAccuracy);

        const wgs84Data = {
          lat: res.latitude.toFixed(8),
          lng: res.longitude.toFixed(8),
          accuracy: res.accuracy != null ? res.accuracy.toFixed(1) + ' 米' : '未知',
          speed: res.speed != null ? res.speed.toFixed(2) + ' m/s' : '未知',
          altitude: res.altitude != null ? res.altitude.toFixed(2) + ' 米' : '未知'
        };

        // wx.getLocation does not expose a reliable Android Mock status.
        // Accuracy alone cannot establish whether a location is simulated.
        console.log("微信 WGS84 完整返回值:", JSON.stringify(res));

        that.setData({
          wgs84: wgs84Data,
          mockInfo: {
            isMock: false,
            message: 'Mock状态未知（wx.getLocation未提供可靠标记）'
          }
        });

        // 另一次请求 GCJ02，非对上述 WGS84 结果的必然转换
        that.getGCJ02(res.latitude, res.longitude);
      },
      fail(err) {
        console.error('WGS84定位失败:', JSON.stringify(err));
        that.setData({
          loading: false,
          lastUpdate: new Date().toLocaleString('zh-CN'),
          mockInfo: { isMock: false, message: '定位失败: ' + err.errMsg }
        });
        wx.showToast({ title: '定位失败', icon: 'none' });
      }
    });
  },

  // 获取 GCJ02 坐标
  getGCJ02(wgsLat, wgsLng) {
    const that = this;
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        console.log('=== GCJ02 坐标 ===');
        console.log('微信 GCJ02 完整返回值:', JSON.stringify(res));
        console.log('定位源:', res.provider || '未提供', '水平精度:', res.horizontalAccuracy ?? res.accuracy ?? '未提供');
        console.log('纬度:', res.latitude);
        console.log('经度:', res.longitude);

        that.setData({
          gcj02: {
            lat: res.latitude.toFixed(8),
            lng: res.longitude.toFixed(8)
          }
        });

        // wx.chooseLocation opens an interactive picker; it is NOT reverse geocoding.
        // Avoid opening a location picker on every refresh.
        that.setData({
          address: { name: '未请求', address: '未配置独立反向地理编码服务' },
          lastUpdate: new Date().toLocaleString('zh-CN'),
          loading: false
        });
      },
      fail(err) {
        console.error('GCJ02定位失败:', JSON.stringify(err));
        that.setData({ loading: false, lastUpdate: new Date().toLocaleString('zh-CN'), gcj02: { lat: '获取失败', lng: err.errMsg || '未知错误' } });
      }
    });
  },

  // Optional manual picker; not automatic geocoding.
  getAddress(lat, lng) {
    const that = this;

    wx.chooseLocation({
      latitude: lat,
      longitude: lng,
      success(res) {
        console.log('=== 地址解析 ===');
        console.log('名称:', res.name);
        console.log('地址:', res.address);
        console.log('纬度:', res.latitude);
        console.log('经度:', res.longitude);

        that.setData({
          address: {
            name: res.name || '无名位置',
            address: res.address || '无法解析地址'
          },
          lastUpdate: new Date().toLocaleString('zh-CN'),
          loading: false
        });
      },
      fail(err) {
        console.error('地址解析失败:', err);
        that.setData({
          address: {
            name: '地址解析失败',
            address: err.errMsg || '未知错误'
          },
          lastUpdate: new Date().toLocaleString('zh-CN'),
          loading: false
        });
      }
    });
  },

  // 刷新定位
  onRefresh() {
    this.getLocation();
  },

  // 复制 WGS84 坐标
  copyWGS84() {
    const { wgs84 } = this.data;
    const text = `${wgs84.lng},${wgs84.lat}`;
    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({ title: 'WGS84已复制', icon: 'success' });
      }
    });
  },

  // 复制 GCJ02 坐标
  copyGCJ02() {
    const { gcj02 } = this.data;
    const text = `${gcj02.lng},${gcj02.lat}`;
    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({ title: 'GCJ02已复制', icon: 'success' });
      }
    });
  },

  // 复制全部信息
  copyAll() {
    const { wgs84, gcj02, address, lastUpdate } = this.data;
    const text = `影梭定位测试
时间: ${lastUpdate}

WGS84 (GPS原始):
纬度: ${wgs84.lat}
经度: ${wgs84.lng}
精度: ${wgs84.accuracy}

GCJ02 (微信/腾讯/高德):
纬度: ${gcj02.lat}
经度: ${gcj02.lng}

地址: ${address.address}
名称: ${address.name}`;

    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({ title: '全部信息已复制', icon: 'success' });
      }
    });
  }
});
