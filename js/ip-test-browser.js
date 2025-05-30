// 浏览器端IP测速工具
// 使用fetch API测试IP的连通性和速度

// 全局变量
let ipv4List = [];  // IPv4地址列表
let ipv6List = [];  // IPv6地址列表
let testResults = []; // 测试结果
let isTestRunning = false; // 是否正在运行测试
let currentProgress = 0; // 当前进度
let totalIps = 0; // 总IP数量
let selectedRegions = []; // 选中的区域
let selectedIPTypes = ['ipv4', 'ipv6']; // 选中的IP类型
let selectedPorts = []; // 选中的端口
let userIP = ''; // 用户的IP地址
let userIsIPv6 = false; // 用户是否使用IPv6

// 用户可配置参数
let userMaxLatency = 200; // 默认最大可接受延迟(ms)
let userMaxTestIPs = 500; // 默认最大测试IP数量

// 配置参数
const CONFIG = {
  ipv4File: 'ip/ips-v4.txt',  // 修正IP列表路径
  ipv6File: 'ip/ips-v6.txt',  // 修正IP列表路径
  concurrentTests: 3,    // 减少并发测试数量，避免被阻止
  testCount: 5,          // 增加每个IP测试次数为5次
  timeout: 5000,         // 增加超时时间为5秒
  topCount: 5,           // 选取的每个国家优质IP数量，默认为5个
  testUrl: 'https://api.ipify.org', // 使用CloudFlare的trace接口
  // 定义要测试的端口列表
  ports: {
    '80': { name: '80', group: '80系', enabled: true },
    '8080': { name: '8080', group: '80系', enabled: true },
    '8880': { name: '8880', group: '80系', enabled: true },
    '2052': { name: '2052', group: '80系', enabled: true },
    '2082': { name: '2082', group: '80系', enabled: true }, 
    '2086': { name: '2086', group: '80系', enabled: true },
    '2095': { name: '2095', group: '80系', enabled: true },
    '443': { name: '443', group: '443系', enabled: true },
    '2053': { name: '2053', group: '443系', enabled: true },
    '2083': { name: '2083', group: '443系', enabled: true },
    '2087': { name: '2087', group: '443系', enabled: true },
    '2096': { name: '2096', group: '443系', enabled: true },
    '8443': { name: '8443', group: '443系', enabled: true }
  },
  // 端口分组
  portGroups: ['80系', '443系'],
  regions: [
    // 亚洲地区
    {id: 'af', name: '阿富汗', region: '亚洲'},
    {id: 'am', name: '亚美尼亚', region: '亚洲'},
    {id: 'az', name: '阿塞拜疆', region: '亚洲'},
    {id: 'bh', name: '巴林', region: '亚洲'},
    {id: 'bd', name: '孟加拉国', region: '亚洲'},
    {id: 'bt', name: '不丹', region: '亚洲'},
    {id: 'bn', name: '文莱', region: '亚洲'},
    {id: 'kh', name: '柬埔寨', region: '亚洲'},
    {id: 'cn', name: '中国', region: '亚洲'},
    {id: 'cy', name: '塞浦路斯', region: '亚洲'},
    {id: 'ge', name: '格鲁吉亚', region: '亚洲'},
    {id: 'hk', name: '香港', region: '亚洲'},
    {id: 'in', name: '印度', region: '亚洲'},
    {id: 'id', name: '印度尼西亚', region: '亚洲'},
    {id: 'ir', name: '伊朗', region: '亚洲'},
    {id: 'iq', name: '伊拉克', region: '亚洲'},
    {id: 'il', name: '以色列', region: '亚洲'},
    {id: 'jp', name: '日本', region: '亚洲'},
    {id: 'jo', name: '约旦', region: '亚洲'},
    {id: 'kz', name: '哈萨克斯坦', region: '亚洲'},
    {id: 'kw', name: '科威特', region: '亚洲'},
    {id: 'kg', name: '吉尔吉斯斯坦', region: '亚洲'},
    {id: 'la', name: '老挝', region: '亚洲'},
    {id: 'lb', name: '黎巴嫩', region: '亚洲'},
    {id: 'mo', name: '澳门', region: '亚洲'},
    {id: 'my', name: '马来西亚', region: '亚洲'},
    {id: 'mv', name: '马尔代夫', region: '亚洲'},
    {id: 'mn', name: '蒙古', region: '亚洲'},
    {id: 'mm', name: '缅甸', region: '亚洲'},
    {id: 'np', name: '尼泊尔', region: '亚洲'},
    {id: 'kp', name: '朝鲜', region: '亚洲'},
    {id: 'om', name: '阿曼', region: '亚洲'},
    {id: 'pk', name: '巴基斯坦', region: '亚洲'},
    {id: 'ps', name: '巴勒斯坦', region: '亚洲'},
    {id: 'ph', name: '菲律宾', region: '亚洲'},
    {id: 'qa', name: '卡塔尔', region: '亚洲'},
    {id: 'sa', name: '沙特阿拉伯', region: '亚洲'},
    {id: 'sg', name: '新加坡', region: '亚洲'},
    {id: 'kr', name: '韩国', region: '亚洲'},
    {id: 'lk', name: '斯里兰卡', region: '亚洲'},
    {id: 'sy', name: '叙利亚', region: '亚洲'},
    {id: 'tw', name: '台湾', region: '亚洲'},
    {id: 'tj', name: '塔吉克斯坦', region: '亚洲'},
    {id: 'th', name: '泰国', region: '亚洲'},
    {id: 'tr', name: '土耳其', region: '亚洲'},
    {id: 'tm', name: '土库曼斯坦', region: '亚洲'},
    {id: 'ae', name: '阿联酋', region: '亚洲'},
    {id: 'uz', name: '乌兹别克斯坦', region: '亚洲'},
    {id: 'vn', name: '越南', region: '亚洲'},
    {id: 'ye', name: '也门', region: '亚洲'},
    // 欧洲地区
    {id: 'al', name: '阿尔巴尼亚', region: '欧洲'},
    {id: 'ad', name: '安道尔', region: '欧洲'},
    {id: 'at', name: '奥地利', region: '欧洲'},
    {id: 'by', name: '白俄罗斯', region: '欧洲'},
    {id: 'be', name: '比利时', region: '欧洲'},
    {id: 'ba', name: '波黑', region: '欧洲'},
    {id: 'bg', name: '保加利亚', region: '欧洲'},
    {id: 'hr', name: '克罗地亚', region: '欧洲'},
    {id: 'cz', name: '捷克', region: '欧洲'},
    {id: 'dk', name: '丹麦', region: '欧洲'},
    {id: 'ee', name: '爱沙尼亚', region: '欧洲'},
    {id: 'fi', name: '芬兰', region: '欧洲'},
    {id: 'fr', name: '法国', region: '欧洲'},
    {id: 'de', name: '德国', region: '欧洲'},
    {id: 'gr', name: '希腊', region: '欧洲'},
    {id: 'hu', name: '匈牙利', region: '欧洲'},
    {id: 'is', name: '冰岛', region: '欧洲'},
    {id: 'ie', name: '爱尔兰', region: '欧洲'},
    {id: 'it', name: '意大利', region: '欧洲'},
    {id: 'lv', name: '拉脱维亚', region: '欧洲'},
    {id: 'li', name: '列支敦士登', region: '欧洲'},
    {id: 'lt', name: '立陶宛', region: '欧洲'},
    {id: 'lu', name: '卢森堡', region: '欧洲'},
    {id: 'mt', name: '马耳他', region: '欧洲'},
    {id: 'md', name: '摩尔多瓦', region: '欧洲'},
    {id: 'mc', name: '摩纳哥', region: '欧洲'},
    {id: 'me', name: '黑山', region: '欧洲'},
    {id: 'nl', name: '荷兰', region: '欧洲'},
    {id: 'mk', name: '北马其顿', region: '欧洲'},
    {id: 'no', name: '挪威', region: '欧洲'},
    {id: 'pl', name: '波兰', region: '欧洲'},
    {id: 'pt', name: '葡萄牙', region: '欧洲'},
    {id: 'ro', name: '罗马尼亚', region: '欧洲'},
    {id: 'ru', name: '俄罗斯', region: '欧洲'},
    {id: 'sm', name: '圣马力诺', region: '欧洲'},
    {id: 'rs', name: '塞尔维亚', region: '欧洲'},
    {id: 'sk', name: '斯洛伐克', region: '欧洲'},
    {id: 'si', name: '斯洛文尼亚', region: '欧洲'},
    {id: 'es', name: '西班牙', region: '欧洲'},
    {id: 'se', name: '瑞典', region: '欧洲'},
    {id: 'ch', name: '瑞士', region: '欧洲'},
    {id: 'ua', name: '乌克兰', region: '欧洲'},
    {id: 'uk', name: '英国', region: '欧洲'},
    {id: 'va', name: '梵蒂冈', region: '欧洲'},
    // 非洲地区
    {id: 'dz', name: '阿尔及利亚', region: '非洲'},
    {id: 'ao', name: '安哥拉', region: '非洲'},
    {id: 'bj', name: '贝宁', region: '非洲'},
    {id: 'bw', name: '博茨瓦纳', region: '非洲'},
    {id: 'bf', name: '布基纳法索', region: '非洲'},
    {id: 'bi', name: '布隆迪', region: '非洲'},
    {id: 'cv', name: '佛得角', region: '非洲'},
    {id: 'cm', name: '喀麦隆', region: '非洲'},
    {id: 'cf', name: '中非', region: '非洲'},
    {id: 'td', name: '乍得', region: '非洲'},
    {id: 'km', name: '科摩罗', region: '非洲'},
    {id: 'cg', name: '刚果共和国', region: '非洲'},
    {id: 'cd', name: '刚果民主共和国', region: '非洲'},
    {id: 'dj', name: '吉布提', region: '非洲'},
    {id: 'eg', name: '埃及', region: '非洲'},
    {id: 'gq', name: '赤道几内亚', region: '非洲'},
    {id: 'er', name: '厄立特里亚', region: '非洲'},
    {id: 'sz', name: '斯威士兰', region: '非洲'},
    {id: 'et', name: '埃塞俄比亚', region: '非洲'},
    {id: 'ga', name: '加蓬', region: '非洲'},
    {id: 'gm', name: '冈比亚', region: '非洲'},
    {id: 'gh', name: '加纳', region: '非洲'},
    {id: 'gn', name: '几内亚', region: '非洲'},
    {id: 'gw', name: '几内亚比绍', region: '非洲'},
    {id: 'ci', name: '科特迪瓦', region: '非洲'},
    {id: 'ke', name: '肯尼亚', region: '非洲'},
    {id: 'ls', name: '莱索托', region: '非洲'},
    {id: 'lr', name: '利比里亚', region: '非洲'},
    {id: 'ly', name: '利比亚', region: '非洲'},
    {id: 'mg', name: '马达加斯加', region: '非洲'},
    {id: 'mw', name: '马拉维', region: '非洲'},
    {id: 'ml', name: '马里', region: '非洲'},
    {id: 'mr', name: '毛里塔尼亚', region: '非洲'},
    {id: 'mu', name: '毛里求斯', region: '非洲'},
    {id: 'ma', name: '摩洛哥', region: '非洲'},
    {id: 'mz', name: '莫桑比克', region: '非洲'},
    {id: 'na', name: '纳米比亚', region: '非洲'},
    {id: 'ne', name: '尼日尔', region: '非洲'},
    {id: 'ng', name: '尼日利亚', region: '非洲'},
    {id: 'rw', name: '卢旺达', region: '非洲'},
    {id: 'st', name: '圣多美和普林西比', region: '非洲'},
    {id: 'sn', name: '塞内加尔', region: '非洲'},
    {id: 'sc', name: '塞舌尔', region: '非洲'},
    {id: 'sl', name: '塞拉利昂', region: '非洲'},
    {id: 'so', name: '索马里', region: '非洲'},
    {id: 'za', name: '南非', region: '非洲'},
    {id: 'ss', name: '南苏丹', region: '非洲'},
    {id: 'sd', name: '苏丹', region: '非洲'},
    {id: 'tz', name: '坦桑尼亚', region: '非洲'},
    {id: 'tg', name: '多哥', region: '非洲'},
    {id: 'tn', name: '突尼斯', region: '非洲'},
    {id: 'ug', name: '乌干达', region: '非洲'},
    {id: 'zm', name: '赞比亚', region: '非洲'},
    {id: 'zw', name: '津巴布韦', region: '非洲'},
    // 北美地区
    {id: 'ag', name: '安提瓜和巴布达', region: '北美'},
    {id: 'bs', name: '巴哈马', region: '北美'},
    {id: 'bb', name: '巴巴多斯', region: '北美'},
    {id: 'bz', name: '伯利兹', region: '北美'},
    {id: 'ca', name: '加拿大', region: '北美'},
    {id: 'cr', name: '哥斯达黎加', region: '北美'},
    {id: 'cu', name: '古巴', region: '北美'},
    {id: 'dm', name: '多米尼克', region: '北美'},
    {id: 'do', name: '多米尼加', region: '北美'},
    {id: 'sv', name: '萨尔瓦多', region: '北美'},
    {id: 'gd', name: '格林纳达', region: '北美'},
    {id: 'gt', name: '危地马拉', region: '北美'},
    {id: 'ht', name: '海地', region: '北美'},
    {id: 'hn', name: '洪都拉斯', region: '北美'},
    {id: 'jm', name: '牙买加', region: '北美'},
    {id: 'mx', name: '墨西哥', region: '北美'},
    {id: 'ni', name: '尼加拉瓜', region: '北美'},
    {id: 'pa', name: '巴拿马', region: '北美'},
    {id: 'kn', name: '圣基茨和尼维斯', region: '北美'},
    {id: 'lc', name: '圣卢西亚', region: '北美'},
    {id: 'vc', name: '圣文森特和格林纳丁斯', region: '北美'},
    {id: 'tt', name: '特立尼达和多巴哥', region: '北美'},
    {id: 'us', name: '美国', region: '北美'},
    // 南美地区
    {id: 'ar', name: '阿根廷', region: '南美洲'},
    {id: 'bo', name: '玻利维亚', region: '南美洲'},
    {id: 'br', name: '巴西', region: '南美洲'},
    {id: 'cl', name: '智利', region: '南美洲'},
    {id: 'co', name: '哥伦比亚', region: '南美洲'},
    {id: 'ec', name: '厄瓜多尔', region: '南美洲'},
    {id: 'gy', name: '圭亚那', region: '南美洲'},
    {id: 'py', name: '巴拉圭', region: '南美洲'},
    {id: 'pe', name: '秘鲁', region: '南美洲'},
    {id: 'sr', name: '苏里南', region: '南美洲'},
    {id: 'uy', name: '乌拉圭', region: '南美洲'},
    {id: 've', name: '委内瑞拉', region: '南美洲'},
    // 大洋洲
    {id: 'au', name: '澳大利亚', region: '大洋洲'},
    {id: 'fj', name: '斐济', region: '大洋洲'},
    {id: 'ki', name: '基里巴斯', region: '大洋洲'},
    {id: 'mh', name: '马绍尔群岛', region: '大洋洲'},
    {id: 'fm', name: '密克罗尼西亚', region: '大洋洲'},
    {id: 'nr', name: '瑙鲁', region: '大洋洲'},
    {id: 'nz', name: '新西兰', region: '大洋洲'},
    {id: 'pw', name: '帕劳', region: '大洋洲'},
    {id: 'pg', name: '巴布亚新几内亚', region: '大洋洲'},
    {id: 'ws', name: '萨摩亚', region: '大洋洲'},
    {id: 'sb', name: '所罗门群岛', region: '大洋洲'},
    {id: 'to', name: '汤加', region: '大洋洲'},
    {id: 'tv', name: '图瓦卢', region: '大洋洲'},
    {id: 'vu', name: '瓦努阿图', region: '大洋洲'}
  ],
  ipTypes: [
    {id: 'ipv4', name: 'IPv4'},
    {id: 'ipv6', name: 'IPv6'}
  ],
  maxLatency: 200,       // 默认最大延迟阈值(ms)
  maxTestIPs: 500        // 默认最大测试IP数量
};

// 获取区域列表
function getRegionIds() {
  return CONFIG.regions.map(region => region.id);
}

// 获取区域名称
function getRegionName(regionId) {
  const region = CONFIG.regions.find(r => r.id === regionId);
  return region ? region.name : regionId;
}

// 获取大区列表
function getMainRegions() {
  const regions = new Set(CONFIG.regions.map(r => r.region));
  return Array.from(regions);
}

// 初始化变量默认值
userMaxLatency = CONFIG.maxLatency; // 用户自定义延迟阈值
userMaxTestIPs = CONFIG.maxTestIPs; // 用户自定义测试IP数量
selectedPorts = Object.keys(CONFIG.ports).filter(port => CONFIG.ports[port].enabled); // 默认选择启用的端口

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  // 创建UI元素
  createUI();
  
  // 绑定按钮事件
  document.getElementById('start-test').addEventListener('click', startTest);
  document.getElementById('export-results').addEventListener('click', exportResults);
  
  // 添加每区域IP数量设置
  const settingsContainer = document.querySelector('.settings');
  if (settingsContainer) {
    // 找到测试IP数量的设置项
    const maxIpCountItem = Array.from(settingsContainer.querySelectorAll('.setting-item')).find(
      item => item.querySelector('label').getAttribute('for') === 'max-ip-count'
    );
    
    if (maxIpCountItem) {
      // 创建新的设置项
      const regionIpCountItem = document.createElement('div');
      regionIpCountItem.className = 'setting-item';
      regionIpCountItem.innerHTML = `
        <label for="region-ip-count">每区域IP数量:</label>
        <input type="number" id="region-ip-count" min="5" max="50" value="${CONFIG.topCount}" placeholder="默认${CONFIG.topCount}个">
      `;
      
      // 插入到测试IP数量设置后面
      if (maxIpCountItem.nextSibling) {
        settingsContainer.insertBefore(regionIpCountItem, maxIpCountItem.nextSibling);
      } else {
        settingsContainer.appendChild(regionIpCountItem);
      }
    }
  }
  
  // 获取用户设置的延迟阈值
  const latencyInput = document.getElementById('max-latency');
  if (latencyInput) {
    latencyInput.addEventListener('change', () => {
      const value = parseInt(latencyInput.value);
      if (!isNaN(value) && value > 0) {
        userMaxLatency = value;
      } else {
        latencyInput.value = userMaxLatency;
      }
    });
  }
  
  // 获取用户设置的测试IP数量
  const ipCountInput = document.getElementById('max-ip-count');
  if (ipCountInput) {
    ipCountInput.addEventListener('change', () => {
      const value = parseInt(ipCountInput.value);
      if (!isNaN(value) && value > 0) {
        userMaxTestIPs = value;
      } else {
        ipCountInput.value = userMaxTestIPs;
      }
    });
  }
  
  // 获取用户设置的每区域IP数量
  const regionIpCountInput = document.getElementById('region-ip-count');
  if (regionIpCountInput && regionIpCountInput.value) {
    const value = parseInt(regionIpCountInput.value);
    if (!isNaN(value) && value >= 5 && value <= 50) {
      CONFIG.topCount = value;
    }
  }
  
  // 创建筛选器
  createFilters();
  
  // 加载IP列表
  loadIpLists();
  
  // 全局提供CONFIG给其他脚本使用
  window.CONFIG = CONFIG;
});

// 创建UI界面
function createUI() {
  // UI已经在HTML中创建，不需要在这里创建
  // 原来的区域tab按钮绑定已移除，现在使用筛选器
}

// 加载IP列表
async function loadIpLists() {
  try {
    // 尝试获取用户的IP地址
    await getUserIP();
    
    // 从文件加载IPv4列表
    const ipv4Response = await fetch(CONFIG.ipv4File);
    if (ipv4Response.ok) {
      const text = await ipv4Response.text();
      ipv4List = text.split('\n').filter(line => line.trim() !== '');
      console.log(`成功加载IPv4列表文件: ${ipv4List.length}个IP`);
    } else {
      console.error(`加载IPv4列表失败: ${ipv4Response.status} ${ipv4Response.statusText}`);
      throw new Error(`加载IPv4列表失败: HTTP ${ipv4Response.status}`);
    }
    
    // 从文件加载IPv6列表
    const ipv6Response = await fetch(CONFIG.ipv6File);
    if (ipv6Response.ok) {
      const text = await ipv6Response.text();
      ipv6List = text.split('\n').filter(line => line.trim() !== '');
      console.log(`成功加载IPv6列表文件: ${ipv6List.length}个IP`);
    } else {
      console.error(`加载IPv6列表失败: ${ipv6Response.status} ${ipv6Response.statusText}`);
      throw new Error(`加载IPv6列表失败: HTTP ${ipv6Response.status}`);
    }
    
    // 更新状态
    updateStatus(`加载完成: ${ipv4List.length} 个IPv4地址, ${ipv6List.length} 个IPv6地址，用户IP: ${userIP}`);
  } catch (error) {
    console.error("加载IP列表错误:", error);
    updateStatus(`加载IP列表失败: ${error.message}，请检查网络连接或刷新页面重试`);
    // 显示错误提示
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      progressContainer.style.backgroundColor = '#ffebee';
      progressContainer.style.border = '1px solid #f44336';
    }
  }
}

// 获取用户IP地址
async function getUserIP() {
  try {
    // 使用CloudFlare的trace接口获取用户IP
    const response = await fetch('https://api.ipify.org');
    if (response.ok) {
      const text = await response.text();
      const lines = text.split('\n');
      const ipLine = lines.find(line => line.startsWith('ip='));
      if (ipLine) {
        userIP = ipLine.substring(3);
        userIsIPv6 = userIP.includes(':');
        console.log(`获取到用户IP: ${userIP}, IPv6: ${userIsIPv6}`);
      }
    }
  } catch (error) {
    console.error('获取用户IP失败:', error);
  }
}

// 开始测试
async function startTest() {
  if (isTestRunning) return;
  
  // 显示选择对话框
  const selectDialog = document.createElement('div');
  selectDialog.style.position = 'fixed';
  selectDialog.style.top = '50%';
  selectDialog.style.left = '50%';
  selectDialog.style.transform = 'translate(-50%, -50%)';
  selectDialog.style.background = 'white';
  selectDialog.style.padding = '20px';
  selectDialog.style.borderRadius = '8px';
  selectDialog.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
  selectDialog.style.zIndex = '1000';
  selectDialog.style.maxWidth = '600px';
  selectDialog.style.width = '90%';
  selectDialog.style.maxHeight = '80vh';
  selectDialog.style.overflowY = 'auto';
  
  // 添加标题
  const title = document.createElement('h3');
  title.textContent = '优选设置';
  title.style.marginTop = '0';
  selectDialog.appendChild(title);
  
  // 创建两列布局
  const columnsDiv = document.createElement('div');
  columnsDiv.style.display = 'flex';
  columnsDiv.style.flexWrap = 'wrap';
  columnsDiv.style.gap = '20px';
  
  // === 地区选择部分 ===
  const regionColumn = document.createElement('div');
  regionColumn.style.flex = '1';
  regionColumn.style.minWidth = '250px';
  
  const regionTitle = document.createElement('h4');
  regionTitle.textContent = '选择地区';
  regionTitle.style.marginTop = '0';
  regionColumn.appendChild(regionTitle);
  
  // 添加地区全选/取消按钮
  const regionButtonsDiv = document.createElement('div');
  regionButtonsDiv.style.display = 'flex';
  regionButtonsDiv.style.gap = '10px';
  regionButtonsDiv.style.marginBottom = '10px';
  
  const selectAllRegionsBtn = document.createElement('button');
  selectAllRegionsBtn.textContent = '全选地区';
  selectAllRegionsBtn.className = 'btn';
  selectAllRegionsBtn.style.padding = '5px 10px';
  selectAllRegionsBtn.style.fontSize = '14px';
  
  const deselectAllRegionsBtn = document.createElement('button');
  deselectAllRegionsBtn.textContent = '取消全选';
  deselectAllRegionsBtn.className = 'btn';
  deselectAllRegionsBtn.style.padding = '5px 10px';
  deselectAllRegionsBtn.style.fontSize = '14px';
  deselectAllRegionsBtn.style.background = '#ccc';
  
  regionButtonsDiv.appendChild(selectAllRegionsBtn);
  regionButtonsDiv.appendChild(deselectAllRegionsBtn);
  regionColumn.appendChild(regionButtonsDiv);
  
  // 添加地区筛选搜索框
  const regionSearchDiv = document.createElement('div');
  regionSearchDiv.style.marginBottom = '10px';
  
  const regionSearchInput = document.createElement('input');
  regionSearchInput.type = 'text';
  regionSearchInput.placeholder = '搜索地区...';
  regionSearchInput.style.width = '100%';
  regionSearchInput.style.padding = '5px';
  regionSearchInput.style.borderRadius = '4px';
  regionSearchInput.style.border = '1px solid #ddd';
  
  regionSearchDiv.appendChild(regionSearchInput);
  regionColumn.appendChild(regionSearchDiv);
  
  // 地区选择容器
  const regionsDiv = document.createElement('div');
  regionsDiv.style.maxHeight = '300px';
  regionsDiv.style.overflowY = 'auto';
  regionsDiv.style.border = '1px solid #eee';
  regionsDiv.style.padding = '10px';
  regionsDiv.style.borderRadius = '4px';
  
  // 按大洲分组显示地区
  const mainRegions = getMainRegions();
  const regionsByMain = {};
  
  CONFIG.regions.forEach(region => {
    if (!regionsByMain[region.region]) {
      regionsByMain[region.region] = [];
    }
    regionsByMain[region.region].push(region);
  });
  
  mainRegions.forEach(mainRegion => {
    const mainRegionDiv = document.createElement('div');
    mainRegionDiv.style.marginBottom = '15px';
    
    const mainRegionTitle = document.createElement('h5');
    mainRegionTitle.textContent = mainRegion;
    mainRegionTitle.style.margin = '0 0 5px 0';
    mainRegionTitle.style.borderBottom = '1px solid #eee';
    mainRegionTitle.style.paddingBottom = '3px';
    mainRegionDiv.appendChild(mainRegionTitle);
    
    const regionsInMainDiv = document.createElement('div');
    regionsInMainDiv.style.display = 'flex';
    regionsInMainDiv.style.flexWrap = 'wrap';
    regionsInMainDiv.style.gap = '5px';
    
    const regions = regionsByMain[mainRegion] || [];
    regions.forEach(region => {
      const regionLabel = document.createElement('label');
      regionLabel.style.display = 'flex';
      regionLabel.style.alignItems = 'center';
      regionLabel.style.margin = '3px 10px 3px 0';
      regionLabel.style.width = 'calc(50% - 10px)';
      regionLabel.className = 'test-region-option';
      regionLabel.dataset.region = region.id;
      regionLabel.dataset.name = region.name;
      
      const regionCheck = document.createElement('input');
      regionCheck.type = 'checkbox';
      regionCheck.value = region.id;
      regionCheck.className = 'test-region-checkbox';
      regionCheck.checked = true; // 默认选中所有地区
      regionCheck.style.marginRight = '5px';
      
      regionLabel.appendChild(regionCheck);
      regionLabel.appendChild(document.createTextNode(region.name));
      regionsInMainDiv.appendChild(regionLabel);
    });
    
    mainRegionDiv.appendChild(regionsInMainDiv);
    regionsDiv.appendChild(mainRegionDiv);
  });
  
  regionColumn.appendChild(regionsDiv);
  columnsDiv.appendChild(regionColumn);
  
  // === IP类型选择部分 ===
  const ipTypeColumn = document.createElement('div');
  ipTypeColumn.style.flex = '1';
  ipTypeColumn.style.minWidth = '250px';
  
  const ipTypeTitle = document.createElement('h4');
  ipTypeTitle.textContent = '选择IP类型';
  ipTypeTitle.style.marginTop = '0';
  ipTypeColumn.appendChild(ipTypeTitle);
  
  // IP类型选择容器
  const ipTypesDiv = document.createElement('div');
  ipTypesDiv.style.border = '1px solid #eee';
  ipTypesDiv.style.padding = '10px';
  ipTypesDiv.style.borderRadius = '4px';
  ipTypesDiv.style.marginBottom = '20px';
  
  CONFIG.ipTypes.forEach(type => {
    const typeLabel = document.createElement('label');
    typeLabel.style.display = 'flex';
    typeLabel.style.alignItems = 'center';
    typeLabel.style.marginBottom = '10px';
    
    const typeCheck = document.createElement('input');
    typeCheck.type = 'checkbox';
    typeCheck.value = type.id;
    typeCheck.className = 'test-iptype-checkbox';
    typeCheck.checked = true; // 默认选中所有IP类型
    typeCheck.style.marginRight = '5px';
    
    typeLabel.appendChild(typeCheck);
    typeLabel.appendChild(document.createTextNode(type.name));
    ipTypesDiv.appendChild(typeLabel);
  });
  
  ipTypeColumn.appendChild(ipTypesDiv);
  
  // === 端口选择部分 ===
  const portTitle = document.createElement('h4');
  portTitle.textContent = '选择端口';
  portTitle.style.marginTop = '0';
  ipTypeColumn.appendChild(portTitle);
  
  // 添加端口全选/取消按钮
  const portButtonsDiv = document.createElement('div');
  portButtonsDiv.style.display = 'flex';
  portButtonsDiv.style.gap = '10px';
  portButtonsDiv.style.marginBottom = '10px';
  
  const selectAllPortsBtn = document.createElement('button');
  selectAllPortsBtn.textContent = '全选端口';
  selectAllPortsBtn.className = 'btn';
  selectAllPortsBtn.style.padding = '5px 10px';
  selectAllPortsBtn.style.fontSize = '14px';
  
  const deselectAllPortsBtn = document.createElement('button');
  deselectAllPortsBtn.textContent = '取消全选';
  deselectAllPortsBtn.className = 'btn';
  deselectAllPortsBtn.style.padding = '5px 10px';
  deselectAllPortsBtn.style.fontSize = '14px';
  deselectAllPortsBtn.style.background = '#ccc';
  
  portButtonsDiv.appendChild(selectAllPortsBtn);
  portButtonsDiv.appendChild(deselectAllPortsBtn);
  ipTypeColumn.appendChild(portButtonsDiv);
  
  // 端口选择容器
  const portsDiv = document.createElement('div');
  portsDiv.style.maxHeight = '200px';
  portsDiv.style.overflowY = 'auto';
  portsDiv.style.border = '1px solid #eee';
  portsDiv.style.padding = '10px';
  portsDiv.style.borderRadius = '4px';
  
  // 按组分类端口
  const portGroups = {};
  CONFIG.portGroups.forEach(group => {
    portGroups[group] = [];
  });
  
  // 填充端口组
  Object.entries(CONFIG.ports).forEach(([port, info]) => {
    if (info.group && portGroups[info.group]) {
      portGroups[info.group].push({
        port: port,
        name: info.name
      });
    }
  });
  
  // 创建端口选择UI
  Object.entries(portGroups).forEach(([group, ports]) => {
    const groupDiv = document.createElement('div');
    groupDiv.style.marginBottom = '15px';
    
    const groupTitle = document.createElement('h5');
    groupTitle.textContent = group;
    groupTitle.style.margin = '0 0 5px 0';
    groupTitle.style.borderBottom = '1px solid #eee';
    groupTitle.style.paddingBottom = '3px';
    groupDiv.appendChild(groupTitle);
    
    const portsInGroupDiv = document.createElement('div');
    portsInGroupDiv.style.display = 'flex';
    portsInGroupDiv.style.flexWrap = 'wrap';
    portsInGroupDiv.style.gap = '5px';
    
    ports.forEach(portInfo => {
      const portLabel = document.createElement('label');
      portLabel.style.display = 'flex';
      portLabel.style.alignItems = 'center';
      portLabel.style.margin = '3px 10px 3px 0';
      portLabel.style.width = 'calc(50% - 10px)';
      
      const portCheck = document.createElement('input');
      portCheck.type = 'checkbox';
      portCheck.value = portInfo.port;
      portCheck.className = 'test-port-checkbox';
      portCheck.checked = true; // 默认选中所有端口
      portCheck.style.marginRight = '5px';
      
      portLabel.appendChild(portCheck);
      portLabel.appendChild(document.createTextNode(portInfo.port));
      portsInGroupDiv.appendChild(portLabel);
    });
    
    groupDiv.appendChild(portsInGroupDiv);
    portsDiv.appendChild(groupDiv);
  });
  
  ipTypeColumn.appendChild(portsDiv);
  columnsDiv.appendChild(ipTypeColumn);
  selectDialog.appendChild(columnsDiv);
  
  // 添加设置项
  const settingsDiv = document.createElement('div');
  settingsDiv.style.marginTop = '20px';
  settingsDiv.style.borderTop = '1px solid #eee';
  settingsDiv.style.paddingTop = '15px';
  
  // 延迟阈值设置
  const latencyDiv = document.createElement('div');
  latencyDiv.style.marginBottom = '10px';
  latencyDiv.style.display = 'flex';
  latencyDiv.style.alignItems = 'center';
  
  const latencyLabel = document.createElement('label');
  latencyLabel.textContent = '延迟阈值(ms):';
  latencyLabel.style.marginRight = '10px';
  latencyLabel.style.width = '120px';
  
  const latencyInput = document.createElement('input');
  latencyInput.type = 'number';
  latencyInput.min = '50';
  latencyInput.max = '1000';
  latencyInput.value = userMaxLatency;
  latencyInput.style.width = '80px';
  latencyInput.style.padding = '5px';
  latencyInput.style.borderRadius = '4px';
  latencyInput.style.border = '1px solid #ddd';
  
  latencyDiv.appendChild(latencyLabel);
  latencyDiv.appendChild(latencyInput);
  settingsDiv.appendChild(latencyDiv);
  
  // 测试IP数量设置
  const ipCountDiv = document.createElement('div');
  ipCountDiv.style.marginBottom = '10px';
  ipCountDiv.style.display = 'flex';
  ipCountDiv.style.alignItems = 'center';
  
  const ipCountLabel = document.createElement('label');
  ipCountLabel.textContent = '测试IP数量:';
  ipCountLabel.style.marginRight = '10px';
  ipCountLabel.style.width = '120px';
  
  const ipCountInput = document.createElement('input');
  ipCountInput.type = 'number';
  ipCountInput.min = '50';
  ipCountInput.max = '2000';
  ipCountInput.value = userMaxTestIPs;
  ipCountInput.style.width = '80px';
  ipCountInput.style.padding = '5px';
  ipCountInput.style.borderRadius = '4px';
  ipCountInput.style.border = '1px solid #ddd';
  
  ipCountDiv.appendChild(ipCountLabel);
  ipCountDiv.appendChild(ipCountInput);
  settingsDiv.appendChild(ipCountDiv);
  
  // 每区域IP数量设置
  const regionIpCountDiv = document.createElement('div');
  regionIpCountDiv.style.marginBottom = '10px';
  regionIpCountDiv.style.display = 'flex';
  regionIpCountDiv.style.alignItems = 'center';
  
  const regionIpCountLabel = document.createElement('label');
  regionIpCountLabel.textContent = '每区域IP数量:';
  regionIpCountLabel.style.marginRight = '10px';
  regionIpCountLabel.style.width = '120px';
  
  const regionIpCountInput = document.createElement('input');
  regionIpCountInput.type = 'number';
  regionIpCountInput.min = '5';
  regionIpCountInput.max = '50';
  regionIpCountInput.value = CONFIG.topCount;
  regionIpCountInput.style.width = '80px';
  regionIpCountInput.style.padding = '5px';
  regionIpCountInput.style.borderRadius = '4px';
  regionIpCountInput.style.border = '1px solid #ddd';
  
  regionIpCountDiv.appendChild(regionIpCountLabel);
  regionIpCountDiv.appendChild(regionIpCountInput);
  settingsDiv.appendChild(regionIpCountDiv);
  
  selectDialog.appendChild(settingsDiv);
  
  // 添加按钮
  const buttonDiv = document.createElement('div');
  buttonDiv.style.display = 'flex';
  buttonDiv.style.justifyContent = 'flex-end';
  buttonDiv.style.gap = '10px';
  buttonDiv.style.marginTop = '20px';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '取消';
  cancelBtn.className = 'btn';
  cancelBtn.style.background = '#ccc';
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(selectDialog);
    document.body.removeChild(overlay);
  });
  
  const startBtn = document.createElement('button');
  startBtn.textContent = '开始优选';
  startBtn.className = 'btn';
  startBtn.addEventListener('click', async () => {
    // 获取选中的地区
    const selectedRegionIds = [];
    selectDialog.querySelectorAll('.test-region-checkbox:checked').forEach(checkbox => {
      selectedRegionIds.push(checkbox.value);
    });
    
    // 获取选中的IP类型
    const selectedIPTypeIds = [];
    selectDialog.querySelectorAll('.test-iptype-checkbox:checked').forEach(checkbox => {
      selectedIPTypeIds.push(checkbox.value);
    });
    
    // 获取选中的端口
    const selectedPortIds = [];
    selectDialog.querySelectorAll('.test-port-checkbox:checked').forEach(checkbox => {
      selectedPortIds.push(checkbox.value);
    });
    
    // 获取设置值
    const latencyValue = parseInt(latencyInput.value);
    if (!isNaN(latencyValue) && latencyValue > 0) {
      userMaxLatency = latencyValue;
    }
    
    const ipCountValue = parseInt(ipCountInput.value);
    if (!isNaN(ipCountValue) && ipCountValue > 0) {
      userMaxTestIPs = ipCountValue;
    }
    
    const regionIpCountValue = parseInt(regionIpCountInput.value);
    if (!isNaN(regionIpCountValue) && regionIpCountValue >= 5 && regionIpCountValue <= 50) {
      CONFIG.topCount = regionIpCountValue;
    }
    
    // 如果没有选择地区，默认全选
    if (selectedRegionIds.length === 0) {
      CONFIG.regions.forEach(region => {
        selectedRegionIds.push(region.id);
      });
    }
    
    // 如果没有选择IP类型，默认全选
    if (selectedIPTypeIds.length === 0) {
      CONFIG.ipTypes.forEach(type => {
        selectedIPTypeIds.push(type.id);
      });
    }
    
    // 如果没有选择端口，默认全选
    if (selectedPortIds.length === 0) {
      Object.keys(CONFIG.ports).forEach(port => {
        selectedPortIds.push(port);
      });
    }
    
    // 关闭对话框
    document.body.removeChild(selectDialog);
    document.body.removeChild(overlay);
    
    // 执行优选
    await runTest(selectedRegionIds, selectedIPTypeIds, selectedPortIds);
  });
  
  buttonDiv.appendChild(cancelBtn);
  buttonDiv.appendChild(startBtn);
  selectDialog.appendChild(buttonDiv);
  
  // 绑定地区搜索功能
  regionSearchInput.addEventListener('input', function() {
    const searchText = this.value.toLowerCase();
    selectDialog.querySelectorAll('.test-region-option').forEach(option => {
      const regionName = option.dataset.name.toLowerCase();
      const regionId = option.dataset.region.toLowerCase();
      
      if (searchText === '' || regionName.includes(searchText) || regionId.includes(searchText)) {
        option.style.display = '';
      } else {
        option.style.display = 'none';
      }
    });
  });
  
  // 绑定地区全选/取消按钮
  selectAllRegionsBtn.addEventListener('click', () => {
    selectDialog.querySelectorAll('.test-region-checkbox').forEach(checkbox => {
      checkbox.checked = true;
    });
  });
  
  deselectAllRegionsBtn.addEventListener('click', () => {
    selectDialog.querySelectorAll('.test-region-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
  });
  
  // 绑定端口全选/取消按钮
  selectAllPortsBtn.addEventListener('click', () => {
    selectDialog.querySelectorAll('.test-port-checkbox').forEach(checkbox => {
      checkbox.checked = true;
    });
  });
  
  deselectAllPortsBtn.addEventListener('click', () => {
    selectDialog.querySelectorAll('.test-port-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
  });
  
  // 添加遮罩层
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0,0,0,0.5)';
  overlay.style.zIndex = '999';
  
  // 添加到页面
  document.body.appendChild(overlay);
  document.body.appendChild(selectDialog);
}

// 实际运行测试的函数
async function runTest(selectedRegionIds, selectedIPTypeIds, selectedPortIds) {
  if (isTestRunning) return;
  
  // 重置状态
  isTestRunning = true;
  testResults = [];
  currentProgress = 0;
  document.getElementById('start-test').disabled = true;
  document.getElementById('export-results').disabled = true;
  document.getElementById('progress-bar').style.width = '0%';
  document.getElementById('result-tbody').innerHTML = '';
  document.querySelector('.results').style.display = 'none';
  
  // 更新界面上的设置值
  const latencyInput = document.getElementById('max-latency');
  if (latencyInput) {
    latencyInput.value = userMaxLatency;
  }
  
  const ipCountInput = document.getElementById('max-ip-count');
  if (ipCountInput) {
    ipCountInput.value = userMaxTestIPs;
  }
  
  const regionIpCountInput = document.getElementById('region-ip-count');
  if (regionIpCountInput) {
    regionIpCountInput.value = CONFIG.topCount;
  }
  
  // 更新选中的IP类型
  selectedIPTypes = selectedIPTypeIds;
  
  // 更新选中的地区
  selectedRegions = selectedRegionIds;
  
  // 更新选中的端口
  selectedPorts = selectedPortIds;
  
  // 更新端口启用状态
  Object.keys(CONFIG.ports).forEach(port => {
    CONFIG.ports[port].enabled = selectedPorts.includes(port);
  });
  
  // 筛选要测试的IP列表
  let testList = [];
  
  // 根据选择的IP类型筛选
  if (selectedIPTypes.includes('ipv4')) {
    testList = testList.concat(ipv4List);
  }
  
  if (selectedIPTypes.includes('ipv6')) {
    testList = testList.concat(ipv6List);
  }
  
  // 测试所有IP地址，不限制数量
  totalIps = testList.length;
  
  updateStatus(`将测试 ${totalIps} 个IP地址，使用 ${selectedPorts.length} 个端口...`);
  
  // 批量测试IP
  await batchTestIps(testList);
  
  // 测试完成，显示结果
  isTestRunning = false;
  document.getElementById('start-test').disabled = false;
  document.getElementById('export-results').disabled = false;
  document.querySelector('.results').style.display = 'block';
  
  // 更新筛选器选中状态
  document.querySelectorAll('.ip-type-filter').forEach(cb => {
    cb.checked = selectedIPTypes.includes(cb.value);
  });
  
  document.querySelectorAll('.region-filter').forEach(cb => {
    cb.checked = selectedRegions.includes(cb.value);
  });
  
  // 显示结果
  displayResults();
  
  updateStatus(`优选完成，${testResults.filter(r => r.status === 'success').length} 个IP可用`);
}

// 批量测试IP
async function batchTestIps(ipList) {
  for (let i = 0; i < ipList.length; i += CONFIG.concurrentTests) {
    const batch = ipList.slice(i, i + CONFIG.concurrentTests);
    const batchPromises = batch.map(ip => testIpLatency(ip));
    
    const batchResults = await Promise.all(batchPromises);
    testResults.push(...batchResults);
    
    // 更新进度
    currentProgress = Math.min(i + CONFIG.concurrentTests, totalIps);
    const progressPercent = (currentProgress / totalIps * 100).toFixed(1);
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
    updateStatus(`测试进度: ${currentProgress}/${totalIps} (${progressPercent}%)`);
  }
}

// 测试单个IP的延迟
async function testIpLatency(ip) {
  // 从CIDR格式提取IP，并生成真实IP地址
  const baseIp = ip.split('/')[0];
  const isIpv6 = baseIp.includes(':');
  
  // 将网段地址转换为随机的真实IP地址
  let realIp;
  if (isIpv6) {
    // 对于IPv6，修改最后一个段
    const parts = baseIp.split(':');
    const lastPart = parts.pop();
    // 生成随机十六进制数(1-ffff)
    const randomHex = Math.floor(Math.random() * 65535 + 1).toString(16);
    parts.push(randomHex);
    realIp = parts.join(':');
  } else {
    // 对于IPv4，修改最后一个段
    const parts = baseIp.split('.');
    // 如果最后一个段是0，替换为随机数(1-254)
    if (parts[3] === '0') {
      parts[3] = Math.floor(Math.random() * 254 + 1).toString();
    }
    realIp = parts.join('.');
  }
  
  // 测试结果对象
  const result = {
    ip: realIp, // 使用生成的真实IP地址
    isIpv6: isIpv6,
    latency: 9999,
    tcpLatency: 9999, // TCP连接延迟
    httpLatency: 9999, // HTTP响应延迟
    totalLatency: 9999, // 综合延迟
    region: 'unknown',
    status: 'timeout',
    ports: [] // 记录可用的端口
  };
  
  try {
    // 多次测试取平均值
    let totalLatency = 0;
    let totalTcpLatency = 0;
    let totalHttpLatency = 0;
    let successCount = 0;
    let minLatency = Infinity;
    
    // 只测试已选择的端口
    const portsToTest = Object.keys(CONFIG.ports).filter(port => CONFIG.ports[port].enabled);
    
    // 使用用户IP来测试而不是随机IP
    const testIP = userIP && ((isIpv6 && userIsIPv6) || (!isIpv6 && !userIsIPv6)) ? userIP : realIp;
    
    // 默认先测试443端口（不带端口号）
    if (portsToTest.includes('443')) {
      for (let i = 0; i < CONFIG.testCount; i++) {
        try {
          // 使用更精确的时间测量
          const startTime = performance.now();
          
          // 使用fetch API测试TCP连接和HTTP响应时间
          const controller = new AbortController();
          const signal = controller.signal;
          const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
          
          try {
            // 添加随机参数防止缓存
            const randomParam = Math.random().toString(36).substring(7);
            const url = `https://${realIp}?ip=${encodeURIComponent(testIP)}&t=${Date.now()}&r=${randomParam}`;
            
            // 测量TCP连接时间 (使用性能标记)
            const tcpStartTime = performance.now();
            
            // 使用HEAD请求减少数据传输
            const response = await fetch(url, {
              method: 'HEAD',
              mode: 'no-cors', // 使用no-cors模式避免CORS问题
              cache: 'no-store',
              credentials: 'omit',
              redirect: 'manual',
              signal,
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            const endTime = performance.now();
            
            // 计算总延迟和HTTP延迟
            const totalTestLatency = endTime - startTime;
            const tcpTestLatency = tcpStartTime - startTime; // TCP连接建立时间
            const httpTestLatency = endTime - tcpStartTime; // HTTP响应时间
            
            // 过滤掉异常值（如果延迟小于5ms，可能是浏览器缓存或其他问题）
            if (totalTestLatency >= 5) {
              totalLatency += totalTestLatency;
              totalTcpLatency += tcpTestLatency;
              totalHttpLatency += httpTestLatency;
              successCount++;
              minLatency = Math.min(minLatency, totalTestLatency);
              
              // 默认的443端口
              if (!result.ports.includes('443')) {
                result.ports.push('443');
              }
            }
            
            clearTimeout(timeoutId);
          } catch (fetchError) {
            // 如果是AbortError（超时），则忽略
            if (fetchError.name !== 'AbortError') {
              console.log(`测试IP ${realIp} 失败: ${fetchError.message}`);
            }
            clearTimeout(timeoutId);
          }
        } catch (error) {
          // 忽略错误，继续下一次测试
          console.log(`测试IP ${realIp} 失败: ${error.message}`);
        }
      }
    }
    
    // 测试其他选定的端口
    for (const port of portsToTest) {
      if (port === '443') continue; // 跳过默认已测试的端口
      
      try {
        const randomParam = Math.random().toString(36).substring(7);
        const url = `https://${realIp}:${port}?ip=${encodeURIComponent(testIP)}&t=${Date.now()}&r=${randomParam}`;
        
        const controller = new AbortController();
        const signal = controller.signal;
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
        
        try {
          // 测量TCP连接时间
          const startTime = performance.now();
          const tcpStartTime = performance.now();
          
          // 使用HEAD请求减少数据传输
          await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-store',
            credentials: 'omit',
            redirect: 'manual',
            signal,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          const endTime = performance.now();
          
          // 计算端口延迟
          const portLatency = endTime - startTime;
          const tcpPortLatency = tcpStartTime - startTime;
          const httpPortLatency = endTime - tcpStartTime;
          
          // 过滤掉异常值
          if (portLatency >= 5) {
            // 如果能连接，记录端口
            result.ports.push(port);
            
            // 如果是第一次测试成功，或者这个端口的延迟更低，更新总延迟
            if (successCount === 0 || portLatency < minLatency) {
              totalLatency += portLatency;
              totalTcpLatency += tcpPortLatency;
              totalHttpLatency += httpPortLatency;
              successCount++;
              minLatency = Math.min(minLatency, portLatency);
            }
          }
          
          clearTimeout(timeoutId);
        } catch (fetchError) {
          // 如果是AbortError（超时），则忽略
          if (fetchError.name !== 'AbortError') {
            console.log(`测试IP ${realIp} 端口 ${port} 失败: ${fetchError.message}`);
          }
          clearTimeout(timeoutId);
        }
      } catch (error) {
        // 忽略错误，继续下一个端口
        console.log(`测试IP ${realIp} 端口 ${port} 失败: ${error.message}`);
      }
    }
    
    // 计算平均延迟
    if (successCount > 0) {
      // 使用最小延迟而不是平均延迟，可以更好地反映网络质量
      const avgLatency = minLatency; // 或者 totalLatency / successCount;
      const avgTcpLatency = totalTcpLatency / successCount;
      const avgHttpLatency = totalHttpLatency / successCount;
      
      // 计算综合延迟得分，考虑不同类型延迟的权重
      // 通常TCP连接时间主要反映网络距离和传播延迟，HTTP响应时间反映处理延迟
      const weightedLatency = (avgTcpLatency * 0.6) + (avgHttpLatency * 0.4);
      
      result.latency = avgLatency;
      result.tcpLatency = avgTcpLatency;
      result.httpLatency = avgHttpLatency;
      result.totalLatency = weightedLatency;
      result.status = 'success';
      
      // 根据延迟估计地理位置
      const latencyFactor = userMaxLatency / 200; // 根据用户设置的延迟阈值调整区域判断标准
      
      /* 
       * 根据延迟综合评估地理位置
       * 考虑传输延迟、处理延迟、排队延迟和传播延迟的综合因素
       * 传播延迟公式：L = D/V，其中D为距离，V为光在光纤中的传播速度(约为2*10^8 m/s)
       * 不同地区的基准参考值(毫秒)：
       * - 同区域: 20-50ms (主要是处理和排队延迟)
       * - 相邻国家/地区: 50-100ms (加上一定的传播延迟)
       * - 跨洲际: 100-300ms (较长传播距离带来的显著传播延迟)
       */
      
      // 亚洲区域 (基于传播距离估算)
      if (avgLatency < 30 * latencyFactor) result.region = 'cn'; // 中国大陆
      else if (avgLatency < 50 * latencyFactor) result.region = 'hk'; // 香港
      else if (avgLatency < 60 * latencyFactor) result.region = 'tw'; // 台湾
      else if (avgLatency < 70 * latencyFactor) result.region = 'jp'; // 日本
      else if (avgLatency < 80 * latencyFactor) result.region = 'kr'; // 韩国
      else if (avgLatency < 90 * latencyFactor) result.region = 'sg'; // 新加坡
      else if (avgLatency < 100 * latencyFactor) result.region = 'my'; // 马来西亚
      else if (avgLatency < 110 * latencyFactor) result.region = 'th'; // 泰国
      else if (avgLatency < 120 * latencyFactor) result.region = 'vn'; // 越南
      else if (avgLatency < 130 * latencyFactor) result.region = 'ph'; // 菲律宾
      else if (avgLatency < 150 * latencyFactor) result.region = 'in'; // 印度
      // 大洋洲
      else if (avgLatency < 160 * latencyFactor) result.region = 'au'; // 澳大利亚
      else if (avgLatency < 170 * latencyFactor) result.region = 'nz'; // 新西兰
      // 中东地区
      else if (avgLatency < 180 * latencyFactor) result.region = 'ae'; // 阿联酋
      // 欧洲区域
      else if (avgLatency < 190 * latencyFactor) result.region = 'ru'; // 俄罗斯
      else if (avgLatency < 200 * latencyFactor) result.region = 'tr'; // 土耳其
      else if (avgLatency < 210 * latencyFactor) result.region = 'uk'; // 英国
      else if (avgLatency < 220 * latencyFactor) result.region = 'fr'; // 法国
      else if (avgLatency < 230 * latencyFactor) result.region = 'de'; // 德国
      else if (avgLatency < 240 * latencyFactor) result.region = 'nl'; // 荷兰
      else if (avgLatency < 250 * latencyFactor) result.region = 'it'; // 意大利
      else if (avgLatency < 260 * latencyFactor) result.region = 'es'; // 西班牙
      // 北美区域
      else if (avgLatency < 280 * latencyFactor) result.region = 'us'; // 美国
      else if (avgLatency < 290 * latencyFactor) result.region = 'ca'; // 加拿大
      else if (avgLatency < 300 * latencyFactor) result.region = 'mx'; // 墨西哥
      // 南美洲
      else if (avgLatency < 320 * latencyFactor) result.region = 'br'; // 巴西
      else if (avgLatency < 330 * latencyFactor) result.region = 'ar'; // 阿根廷
      else if (avgLatency < 340 * latencyFactor) result.region = 'cl'; // 智利
      // 非洲
      else if (avgLatency < 350 * latencyFactor) result.region = 'za'; // 南非
      else if (avgLatency < 360 * latencyFactor) result.region = 'eg'; // 埃及
      else if (avgLatency < 370 * latencyFactor) result.region = 'ng'; // 尼日利亚
      else result.region = 'unknown'; // 未知区域
    }
  } catch (error) {
    // 测试失败，保持默认状态
    console.error(`测试IP ${realIp} 出错: ${error.message}`);
  }
  
  return result;
}

// 显示测试结果
function displayResults() {
  const tbody = document.getElementById('result-tbody');
  tbody.innerHTML = '';
  
  // 过滤并排序结果
  let filteredResults = testResults.filter(r => r.status === 'success');
  
  // 根据选择的IP类型进行过滤
  if (selectedIPTypes.length > 0) {
    filteredResults = filteredResults.filter(r => 
      (selectedIPTypes.includes('ipv4') && !r.isIpv6) || 
      (selectedIPTypes.includes('ipv6') && r.isIpv6)
    );
  }
  
  // 根据选择的区域进行过滤
  if (selectedRegions.length > 0) {
    filteredResults = filteredResults.filter(r => selectedRegions.includes(r.region));
  }
  
  // 按延迟排序
  filteredResults.sort((a, b) => a.latency - b.latency);
  
  // 按区域分组
  const resultsByRegion = {};
  filteredResults.forEach(result => {
    if (!resultsByRegion[result.region]) {
      resultsByRegion[result.region] = [];
    }
    resultsByRegion[result.region].push(result);
  });
  
  // 显示所有测试结果，而不仅仅是每个区域的前几个
  let finalResults = filteredResults;
  
  // 最终按延迟排序
  finalResults.sort((a, b) => a.latency - b.latency);
  
  // 添加到表格
  finalResults.forEach(result => {
    const row = document.createElement('tr');
    
    // 根据延迟设置行样式
    if (result.latency < userMaxLatency * 0.5) {
      row.className = 'excellent'; // 优秀延迟
    } else if (result.latency < userMaxLatency * 0.8) {
      row.className = 'good'; // 良好延迟
    } else if (result.latency < userMaxLatency) {
      row.className = 'average'; // 一般延迟
    } else {
      row.className = 'poor'; // 较差延迟
    }
    
    // 查找区域信息
    const regionInfo = CONFIG.regions.find(r => r.id === result.region) || { name: result.region, region: '未知' };
    
    // 生成可用端口列表
    const ports80 = result.ports ? result.ports.filter(p => 
        ['80', '8080', '8880', '2052', '2082', '2086', '2095'].includes(p)) : [];
    const ports443 = result.ports ? result.ports.filter(p => 
        ['443', '2053', '2083', '2087', '2096', '8443'].includes(p)) : [];
    
    // 格式化端口显示
    let portsHTML = '';
    if (ports80.length > 0) {
      portsHTML += `<div>80系: ${ports80.join(', ')}</div>`;
    }
    if (ports443.length > 0) {
      portsHTML += `<div>443系: ${ports443.join(', ')}</div>`;
    }
    
    // 格式化延迟显示，添加单位
    const formatLatency = (ms) => {
      if (ms < 1) {
        // 如果延迟小于1ms，显示为小数点后2位的ms
        return `${ms.toFixed(2)} ms`;
      } else if (ms < 100) {
        // 如果延迟小于100ms，显示为整数ms
        return `${Math.round(ms)} ms`;
      } else {
        // 如果延迟大于等于100ms，显示为小数点后2位的秒
        return `${(ms / 1000).toFixed(2)} s`;
      }
    };
    
    // 格式化各类延迟
    const totalLatencyDisplay = formatLatency(result.latency);
    const tcpLatencyDisplay = result.tcpLatency ? formatLatency(result.tcpLatency) : 'N/A';
    const httpLatencyDisplay = result.httpLatency ? formatLatency(result.httpLatency) : 'N/A';
    
    // 创建延迟详情的HTML
    const latencyDetailHTML = `
      <div class="latency-main">${totalLatencyDisplay}</div>
      <div class="latency-details">
        <small>TCP: ${tcpLatencyDisplay}</small>
        <small>HTTP: ${httpLatencyDisplay}</small>
      </div>
    `;
    
    row.innerHTML = `
      <td>${result.ip}</td>
      <td><span class="ip-type ${result.isIpv6 ? 'ipv6' : 'ipv4'}">${result.isIpv6 ? 'IPv6' : 'IPv4'}</span></td>
      <td>${latencyDetailHTML}</td>
      <td>${regionInfo.name}<br><small>(${regionInfo.region})</small></td>
      <td>${portsHTML || '<small>无可用端口</small>'}</td>
    `;
    tbody.appendChild(row);
  });
  
  // 显示结果数量
  const resultCount = finalResults.length;
  if (resultCount === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `<td colspan="5" style="text-align: center;">没有找到符合条件的可用IP</td>`;
    tbody.appendChild(emptyRow);
  }
  
  // 更新结果数量显示
  document.getElementById('result-count').textContent = resultCount;
}

// 处理区域筛选器的变化
function handleRegionFilterChange() {
  selectedRegions = Array.from(document.querySelectorAll('.region-filter:checked')).map(cb => cb.value);
  displayResults();
}

// 处理IP类型筛选器的变化
function handleIPTypeFilterChange() {
  selectedIPTypes = Array.from(document.querySelectorAll('.ip-type-filter:checked')).map(cb => cb.value);
  displayResults();
}

// 处理端口筛选器的变化
function handlePortFilterChange() {
  selectedPorts = Array.from(document.querySelectorAll('.port-filter:checked')).map(cb => cb.value);
  
  // 更新CONFIG.ports的启用状态
  Object.keys(CONFIG.ports).forEach(port => {
    CONFIG.ports[port].enabled = selectedPorts.includes(port);
  });
}

// 创建筛选器UI
function createFilters() {
  const filterContainer = document.getElementById('filters');
  if (!filterContainer) return;
  
  // 创建区域分组的筛选器
  const regionGroups = {};
  CONFIG.regions.forEach(region => {
    if (!regionGroups[region.region]) {
      regionGroups[region.region] = [];
    }
    regionGroups[region.region].push(region);
  });
  
  // 添加筛选控制面板
  const controlPanel = document.createElement('div');
  controlPanel.className = 'filter-controls';
  
  // 添加主区域选择器
  const regionSelector = document.createElement('div');
  regionSelector.className = 'region-selector';
  regionSelector.innerHTML = `
    <label for="main-region">按大洲筛选：</label>
    <select id="main-region">
      <option value="all">所有大洲</option>
      ${getMainRegions().map(region => `<option value="${region}">${region}</option>`).join('')}
    </select>
  `;
  controlPanel.appendChild(regionSelector);
  
  // 添加搜索框
  const searchBox = document.createElement('div');
  searchBox.className = 'search-box';
  searchBox.innerHTML = `
    <input type="text" id="country-search" placeholder="搜索国家/地区...">
  `;
  controlPanel.appendChild(searchBox);
  
  // 添加全选/取消按钮
  const filterButtons = document.createElement('div');
  filterButtons.className = 'filter-buttons';
  
  const selectAllBtn = document.createElement('button');
  selectAllBtn.className = 'btn select-btn';
  selectAllBtn.textContent = '全选';
  filterButtons.appendChild(selectAllBtn);
  
  const deselectAllBtn = document.createElement('button');
  deselectAllBtn.className = 'btn select-btn';
  deselectAllBtn.textContent = '取消全选';
  filterButtons.appendChild(deselectAllBtn);
  
  controlPanel.appendChild(filterButtons);
  filterContainer.appendChild(controlPanel);
  
  // 区域筛选器容器
  const regionFilterContainer = document.createElement('div');
  regionFilterContainer.className = 'filter-section';
  regionFilterContainer.innerHTML = `<h3>按国家/地区筛选</h3>`;
  
  // 创建区域筛选器分组
  const filterGroups = document.createElement('div');
  filterGroups.className = 'filter-groups';
  
  Object.entries(regionGroups).forEach(([mainRegion, regions]) => {
    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group';
    filterGroup.dataset.region = mainRegion;
    
    filterGroup.innerHTML = `
      <h4>${mainRegion}</h4>
      <div class="filter-options">
        ${regions.map(region => `
          <label class="filter-option" data-region="${mainRegion}">
            <input type="checkbox" class="region-filter" value="${region.id}">
            <span>${region.name}</span>
          </label>
        `).join('')}
      </div>
    `;
    
    filterGroups.appendChild(filterGroup);
  });
  
  regionFilterContainer.appendChild(filterGroups);
  filterContainer.appendChild(regionFilterContainer);
  
  // IP类型筛选器
  const ipTypeFilterContainer = document.createElement('div');
  ipTypeFilterContainer.className = 'filter-section';
  ipTypeFilterContainer.innerHTML = `
    <h3>按IP类型筛选</h3>
    <div class="filter-options">
      ${CONFIG.ipTypes.map(type => `
        <label class="filter-option">
          <input type="checkbox" class="ip-type-filter" value="${type.id}" checked>
          <span>${type.name}</span>
        </label>
      `).join('')}
    </div>
  `;
  
  filterContainer.appendChild(ipTypeFilterContainer);
  
  // 端口筛选器
  const portFilterContainer = document.createElement('div');
  portFilterContainer.className = 'filter-section';
  portFilterContainer.innerHTML = `<h3>按端口筛选</h3>`;
  
  // 创建端口筛选器分组
  const portGroups = document.createElement('div');
  portGroups.className = 'filter-groups port-groups';
  
  // 为每个端口组创建一个分组
  CONFIG.portGroups.forEach(groupName => {
    const portGroup = document.createElement('div');
    portGroup.className = 'filter-group';
    
    const portsInGroup = Object.entries(CONFIG.ports)
      .filter(([_, port]) => port.group === groupName)
      .map(([portId, port]) => ({ id: portId, ...port }));
    
    portGroup.innerHTML = `
      <h4>${groupName}</h4>
      <div class="filter-options">
        ${portsInGroup.map(port => `
          <label class="filter-option">
            <input type="checkbox" class="port-filter" value="${port.id}" ${port.enabled ? 'checked' : ''}>
            <span>${port.name}</span>
          </label>
        `).join('')}
      </div>
    `;
    
    portGroups.appendChild(portGroup);
  });
  
  portFilterContainer.appendChild(portGroups);
  filterContainer.appendChild(portFilterContainer);
  
  // 绑定事件
  // 区域筛选器变化
  document.querySelectorAll('.region-filter').forEach(cb => {
    cb.addEventListener('change', handleRegionFilterChange);
  });
  
  // IP类型筛选器变化
  document.querySelectorAll('.ip-type-filter').forEach(cb => {
    cb.addEventListener('change', handleIPTypeFilterChange);
  });
  
  // 端口筛选器变化
  document.querySelectorAll('.port-filter').forEach(cb => {
    cb.addEventListener('change', handlePortFilterChange);
  });
  
  // 全选按钮
  selectAllBtn.addEventListener('click', () => {
    // 获取可见的筛选器
    const visibleFilters = Array.from(document.querySelectorAll('.filter-option:not([style*="display: none"]) .region-filter'));
    visibleFilters.forEach(cb => {
      cb.checked = true;
    });
    handleRegionFilterChange();
  });
  
  // 取消全选按钮
  deselectAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.region-filter').forEach(cb => {
      cb.checked = false;
    });
    handleRegionFilterChange();
  });
  
  // 主区域选择变化
  document.getElementById('main-region').addEventListener('change', function() {
    const selectedRegion = this.value;
    document.querySelectorAll('.filter-group').forEach(group => {
      if (selectedRegion === 'all' || group.dataset.region === selectedRegion) {
        group.style.display = '';
      } else {
        group.style.display = 'none';
      }
    });
  });
  
  // 搜索框输入变化
  document.getElementById('country-search').addEventListener('input', function() {
    const searchText = this.value.toLowerCase();
    
    document.querySelectorAll('.filter-option[data-region]').forEach(option => {
      const regionName = option.querySelector('span').textContent.toLowerCase();
      const regionId = option.querySelector('input').value.toLowerCase();
      
      if (searchText === '' || regionName.includes(searchText) || regionId.includes(searchText)) {
        option.style.display = '';
      } else {
        option.style.display = 'none';
      }
    });
    
    // 处理组标题显示
    document.querySelectorAll('.filter-group').forEach(group => {
      const visibleOptions = group.querySelectorAll('.filter-option[style=""]').length + 
                           group.querySelectorAll('.filter-option:not([style*="display: none"])').length;
      if (visibleOptions === 0 && searchText !== '') {
        group.style.display = 'none';
      } else if (document.getElementById('main-region').value === 'all' || 
                document.getElementById('main-region').value === group.dataset.region) {
        group.style.display = '';
      }
    });
  });
}

// 导出测试结果
function exportResults() {
  // 创建选择对话框
  const exportDialog = document.createElement('div');
  exportDialog.style.position = 'fixed';
  exportDialog.style.top = '50%';
  exportDialog.style.left = '50%';
  exportDialog.style.transform = 'translate(-50%, -50%)';
  exportDialog.style.background = 'white';
  exportDialog.style.padding = '20px';
  exportDialog.style.borderRadius = '8px';
  exportDialog.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
  exportDialog.style.zIndex = '1000';
  exportDialog.style.maxWidth = '600px';
  exportDialog.style.width = '90%';
  exportDialog.style.maxHeight = '80vh';
  exportDialog.style.overflowY = 'auto';
  
  // 添加标题
  const title = document.createElement('h3');
  title.textContent = '导出设置';
  title.style.marginTop = '0';
  exportDialog.appendChild(title);
  
  // 创建两列布局
  const columnsDiv = document.createElement('div');
  columnsDiv.style.display = 'flex';
  columnsDiv.style.flexWrap = 'wrap';
  columnsDiv.style.gap = '20px';
  
  // === 地区选择部分 ===
  const regionColumn = document.createElement('div');
  regionColumn.style.flex = '1';
  regionColumn.style.minWidth = '250px';
  
  const regionTitle = document.createElement('h4');
  regionTitle.textContent = '选择地区';
  regionTitle.style.marginTop = '0';
  regionColumn.appendChild(regionTitle);
  
  // 添加地区全选/取消按钮
  const regionButtonsDiv = document.createElement('div');
  regionButtonsDiv.style.display = 'flex';
  regionButtonsDiv.style.gap = '10px';
  regionButtonsDiv.style.marginBottom = '10px';
  
  const selectAllRegionsBtn = document.createElement('button');
  selectAllRegionsBtn.textContent = '全选地区';
  selectAllRegionsBtn.className = 'btn';
  selectAllRegionsBtn.style.padding = '5px 10px';
  selectAllRegionsBtn.style.fontSize = '14px';
  
  const deselectAllRegionsBtn = document.createElement('button');
  deselectAllRegionsBtn.textContent = '取消全选';
  deselectAllRegionsBtn.className = 'btn';
  deselectAllRegionsBtn.style.padding = '5px 10px';
  deselectAllRegionsBtn.style.fontSize = '14px';
  deselectAllRegionsBtn.style.background = '#ccc';
  
  regionButtonsDiv.appendChild(selectAllRegionsBtn);
  regionButtonsDiv.appendChild(deselectAllRegionsBtn);
  regionColumn.appendChild(regionButtonsDiv);
  
  // 添加地区筛选搜索框
  const regionSearchDiv = document.createElement('div');
  regionSearchDiv.style.marginBottom = '10px';
  
  const regionSearchInput = document.createElement('input');
  regionSearchInput.type = 'text';
  regionSearchInput.placeholder = '搜索地区...';
  regionSearchInput.style.width = '100%';
  regionSearchInput.style.padding = '5px';
  regionSearchInput.style.borderRadius = '4px';
  regionSearchInput.style.border = '1px solid #ddd';
  
  regionSearchDiv.appendChild(regionSearchInput);
  regionColumn.appendChild(regionSearchDiv);
  
  // 地区选择容器
  const regionsDiv = document.createElement('div');
  regionsDiv.style.maxHeight = '300px';
  regionsDiv.style.overflowY = 'auto';
  regionsDiv.style.border = '1px solid #eee';
  regionsDiv.style.padding = '10px';
  regionsDiv.style.borderRadius = '4px';
  
  // 按大洲分组显示地区
  const mainRegions = getMainRegions();
  const regionsByMain = {};
  
  CONFIG.regions.forEach(region => {
    if (!regionsByMain[region.region]) {
      regionsByMain[region.region] = [];
    }
    regionsByMain[region.region].push(region);
  });
  
  mainRegions.forEach(mainRegion => {
    const mainRegionDiv = document.createElement('div');
    mainRegionDiv.style.marginBottom = '15px';
    
    const mainRegionTitle = document.createElement('h5');
    mainRegionTitle.textContent = mainRegion;
    mainRegionTitle.style.margin = '0 0 5px 0';
    mainRegionTitle.style.borderBottom = '1px solid #eee';
    mainRegionTitle.style.paddingBottom = '3px';
    mainRegionDiv.appendChild(mainRegionTitle);
    
    const regionsInMainDiv = document.createElement('div');
    regionsInMainDiv.style.display = 'flex';
    regionsInMainDiv.style.flexWrap = 'wrap';
    regionsInMainDiv.style.gap = '5px';
    
    const regions = regionsByMain[mainRegion] || [];
    regions.forEach(region => {
      const regionLabel = document.createElement('label');
      regionLabel.style.display = 'flex';
      regionLabel.style.alignItems = 'center';
      regionLabel.style.margin = '3px 10px 3px 0';
      regionLabel.style.width = 'calc(50% - 10px)';
      regionLabel.className = 'export-region-option';
      regionLabel.dataset.region = region.id;
      regionLabel.dataset.name = region.name;
      
      const regionCheck = document.createElement('input');
      regionCheck.type = 'checkbox';
      regionCheck.value = region.id;
      regionCheck.className = 'export-region-checkbox';
      regionCheck.checked = true; // 默认选中所有地区
      regionCheck.style.marginRight = '5px';
      
      regionLabel.appendChild(regionCheck);
      regionLabel.appendChild(document.createTextNode(region.name));
      regionsInMainDiv.appendChild(regionLabel);
    });
    
    mainRegionDiv.appendChild(regionsInMainDiv);
    regionsDiv.appendChild(mainRegionDiv);
  });
  
  regionColumn.appendChild(regionsDiv);
  columnsDiv.appendChild(regionColumn);
  
  // === 端口选择部分 ===
  const portColumn = document.createElement('div');
  portColumn.style.flex = '1';
  portColumn.style.minWidth = '250px';
  
  const portTitle = document.createElement('h4');
  portTitle.textContent = '选择端口';
  portTitle.style.marginTop = '0';
  portColumn.appendChild(portTitle);
  
  // 添加端口全选/取消按钮
  const portButtonsDiv = document.createElement('div');
  portButtonsDiv.style.display = 'flex';
  portButtonsDiv.style.gap = '10px';
  portButtonsDiv.style.marginBottom = '10px';
  
  const selectAllPortsBtn = document.createElement('button');
  selectAllPortsBtn.textContent = '全选端口';
  selectAllPortsBtn.className = 'btn';
  selectAllPortsBtn.style.padding = '5px 10px';
  selectAllPortsBtn.style.fontSize = '14px';
  
  const deselectAllPortsBtn = document.createElement('button');
  deselectAllPortsBtn.textContent = '取消全选';
  deselectAllPortsBtn.className = 'btn';
  deselectAllPortsBtn.style.padding = '5px 10px';
  deselectAllPortsBtn.style.fontSize = '14px';
  deselectAllPortsBtn.style.background = '#ccc';
  
  portButtonsDiv.appendChild(selectAllPortsBtn);
  portButtonsDiv.appendChild(deselectAllPortsBtn);
  portColumn.appendChild(portButtonsDiv);
  
  // 端口选择容器
  const portsDiv = document.createElement('div');
  portsDiv.style.maxHeight = '300px';
  portsDiv.style.overflowY = 'auto';
  portsDiv.style.border = '1px solid #eee';
  portsDiv.style.padding = '10px';
  portsDiv.style.borderRadius = '4px';
  
  // 按组分类端口
  const portGroups = {};
  CONFIG.portGroups.forEach(group => {
    portGroups[group] = [];
  });
  
  // 填充端口组
  Object.entries(CONFIG.ports).forEach(([port, info]) => {
    if (info.group && portGroups[info.group]) {
      portGroups[info.group].push({
        port: port,
        name: info.name,
        default: true // 所有端口默认选中
      });
    }
  });
  
  // 创建端口选择UI
  Object.entries(portGroups).forEach(([group, ports]) => {
    const groupDiv = document.createElement('div');
    groupDiv.style.marginBottom = '15px';
    
    const groupTitle = document.createElement('h5');
    groupTitle.textContent = group;
    groupTitle.style.margin = '0 0 5px 0';
    groupTitle.style.borderBottom = '1px solid #eee';
    groupTitle.style.paddingBottom = '3px';
    groupDiv.appendChild(groupTitle);
    
    const portsInGroupDiv = document.createElement('div');
    portsInGroupDiv.style.display = 'flex';
    portsInGroupDiv.style.flexWrap = 'wrap';
    portsInGroupDiv.style.gap = '5px';
    
    ports.forEach(portInfo => {
      const portLabel = document.createElement('label');
      portLabel.style.display = 'flex';
      portLabel.style.alignItems = 'center';
      portLabel.style.margin = '3px 10px 3px 0';
      portLabel.style.width = 'calc(50% - 10px)';
      
      const portCheck = document.createElement('input');
      portCheck.type = 'checkbox';
      portCheck.value = portInfo.port;
      portCheck.className = 'export-port-checkbox';
      portCheck.checked = portInfo.default;
      portCheck.style.marginRight = '5px';
      
      portLabel.appendChild(portCheck);
      portLabel.appendChild(document.createTextNode(portInfo.port));
      portsInGroupDiv.appendChild(portLabel);
    });
    
    groupDiv.appendChild(portsInGroupDiv);
    portsDiv.appendChild(groupDiv);
  });
  
  portColumn.appendChild(portsDiv);
  columnsDiv.appendChild(portColumn);
  exportDialog.appendChild(columnsDiv);
  
  // 添加按钮
  const buttonDiv = document.createElement('div');
  buttonDiv.style.display = 'flex';
  buttonDiv.style.justifyContent = 'flex-end';
  buttonDiv.style.gap = '10px';
  buttonDiv.style.marginTop = '20px';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '取消';
  cancelBtn.className = 'btn';
  cancelBtn.style.background = '#ccc';
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(exportDialog);
    document.body.removeChild(overlay);
  });
  
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = '导出';
  confirmBtn.className = 'btn';
  confirmBtn.addEventListener('click', () => {
    // 获取选中的端口
    const selectedPorts = [];
    exportDialog.querySelectorAll('.export-port-checkbox:checked').forEach(checkbox => {
      selectedPorts.push(checkbox.value);
    });
    
    // 获取选中的地区
    const selectedRegions = [];
    exportDialog.querySelectorAll('.export-region-checkbox:checked').forEach(checkbox => {
      selectedRegions.push(checkbox.value);
    });
    
    // 如果没有选择端口，默认使用443
    if (selectedPorts.length === 0) {
      selectedPorts.push('443');
    }
    
    // 如果没有选择地区，提示用户
    if (selectedRegions.length === 0) {
      alert('请至少选择一个地区');
      return;
    }
    
    // 按区域分组结果
    const groupedResults = {};
    const mainRegions = getMainRegions(); // 获取主要地区分类
    
    // 初始化每个地区的结果数组
    CONFIG.regions.forEach(region => {
      if (!groupedResults[region.region]) {
        groupedResults[region.region] = {};
      }
      groupedResults[region.region][region.id] = [];
    });
    
    // 根据筛选条件过滤结果
    let filteredResults = testResults.filter(r => r.status === 'success');
    
    // 根据选择的IP类型进行过滤
    if (selectedIPTypes.length > 0) {
      filteredResults = filteredResults.filter(r => 
        (selectedIPTypes.includes('ipv4') && !r.isIpv6) || 
        (selectedIPTypes.includes('ipv6') && r.isIpv6)
      );
    }
    
    // 根据选择的区域进行过滤
    if (selectedRegions.length > 0) {
      filteredResults = filteredResults.filter(r => selectedRegions.includes(r.region));
    }
    
    // 按区域分组并按延迟排序
    const resultsByRegion = {};
    filteredResults.forEach(result => {
      if (!resultsByRegion[result.region]) {
        resultsByRegion[result.region] = [];
      }
      resultsByRegion[result.region].push(result);
    });
    
    // 对每个区域选择最优的IP并分配到对应区域
    Object.entries(resultsByRegion).forEach(([regionId, results]) => {
      // 按延迟排序
      results.sort((a, b) => a.latency - b.latency);
      
      // 获取该地区最优的IP
      const topIPs = results.slice(0, CONFIG.topCount);
      
      // 找到区域所属的主区域
      const region = CONFIG.regions.find(r => r.id === regionId);
      if (region) {
        groupedResults[region.region][regionId] = topIPs;
      }
    });
    
    // 生成导出内容
    let exportContent = '';
    
    // 添加文件头信息
    exportContent += `# CloudFlare IP优选结果\n`;
    exportContent += `# 优选时间: ${new Date().toLocaleString()}\n`;
    exportContent += `# 延迟阈值: ${userMaxLatency}ms\n`;
    exportContent += `# 每个国家/地区选取 ${CONFIG.topCount} 个最优IP\n\n`;
    
    // 按主要地区组织导出内容
    mainRegions.forEach(mainRegion => {
      // 检查这个大区是否有选中的地区
      const regionsInMain = CONFIG.regions.filter(r => r.region === mainRegion && selectedRegions.includes(r.id));
      
      if (regionsInMain.length === 0) return; // 如果该大区没有选中的地区，跳过
      
      exportContent += `# ====== ${mainRegion} ======\n\n`;
      
      // 该主要地区下的所有选中国家/地区
      regionsInMain.forEach(region => {
        const results = groupedResults[mainRegion][region.id];
        
        // 如果该区域有结果，则添加
        if (results && results.length > 0) {
          exportContent += `# ${region.name} 地区\n`;
          
          // 添加结果 - 使用新格式: IP:端口 # 国家或地区
          results.forEach(result => {
            // 为每个选中的端口生成一行
            selectedPorts.forEach(port => {
              exportContent += `${result.ip}:${port}#${region.name}\n`;
            });
          });
          
          exportContent += '\n';
        }
      });
    });
    
    // 添加使用说明
    exportContent += `# 使用说明\n`;
    exportContent += `# 1. 这些IP是通过延迟测试优选出来的，可用于CloudFlare CDN加速\n`;
    exportContent += `# 2. 不同区域的IP可能有不同的网络路径和稳定性\n`;
    exportContent += `# 3. 每个国家/地区选取 ${CONFIG.topCount} 个最优IP\n`;
    exportContent += `# 4. 格式为: IP:端口#国家或地区\n`;
    exportContent += `# 5. 建议定期重新优选，以获取最佳体验\n`;
    exportContent += `# 6. 由呆萌恐龙优选工具生成\n`;
    
    // 创建下载链接
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloudflare-optimized-ips.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    // 关闭对话框
    document.body.removeChild(exportDialog);
    document.body.removeChild(overlay);
  });
  
  buttonDiv.appendChild(cancelBtn);
  buttonDiv.appendChild(confirmBtn);
  exportDialog.appendChild(buttonDiv);
  
  // 绑定地区搜索功能
  regionSearchInput.addEventListener('input', function() {
    const searchText = this.value.toLowerCase();
    exportDialog.querySelectorAll('.export-region-option').forEach(option => {
      const regionName = option.dataset.name.toLowerCase();
      const regionId = option.dataset.region.toLowerCase();
      
      if (searchText === '' || regionName.includes(searchText) || regionId.includes(searchText)) {
        option.style.display = '';
      } else {
        option.style.display = 'none';
      }
    });
  });
  
  // 绑定地区全选/取消按钮
  selectAllRegionsBtn.addEventListener('click', () => {
    exportDialog.querySelectorAll('.export-region-checkbox').forEach(checkbox => {
      checkbox.checked = true;
    });
  });
  
  deselectAllRegionsBtn.addEventListener('click', () => {
    exportDialog.querySelectorAll('.export-region-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
  });
  
  // 绑定端口全选/取消按钮
  selectAllPortsBtn.addEventListener('click', () => {
    exportDialog.querySelectorAll('.export-port-checkbox').forEach(checkbox => {
      checkbox.checked = true;
    });
  });
  
  deselectAllPortsBtn.addEventListener('click', () => {
    exportDialog.querySelectorAll('.export-port-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
  });
  
  // 添加遮罩层
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0,0,0,0.5)';
  overlay.style.zIndex = '999';
  
  // 添加到页面
  document.body.appendChild(overlay);
  document.body.appendChild(exportDialog);
}

// 更新状态文本
function updateStatus(message) {
  document.getElementById('progress-text').textContent = message;
}