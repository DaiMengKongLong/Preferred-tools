const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
// 添加MaxMind GeoIP库支持
const maxmind = require('maxmind');

// 配置参数
const CONFIG = {
  ipv4File: 'ips-v4.txt',
  ipv6File: 'ips-v6.txt',
  concurrentTests: 10,  // 并发测试数量
  testCount: 3,         // 每个IP测试次数
  timeout: 1000,        // 超时时间(ms)
  topCount: 50,         // 选取的优质IP数量
  outputFile: 'optimized-ips.txt',  // 输出文件
  // GeoIP数据库配置
  geoIpDb: {
    city: 'GeoLite2-City.mmdb',     // 城市数据库文件
    country: 'GeoLite2-Country.mmdb', // 国家数据库文件
    asn: 'GeoLite2-ASN.mmdb',       // ASN数据库文件
    useLocalFallback: true          // 使用本地IP段作为后备
  }
};

// GeoIP查找器实例
let geoIpLookup = {
  city: null,
  country: null,
  asn: null,
  initialized: false
};

// 初始化GeoIP数据库
async function initGeoIpDb() {
  try {
    // 尝试加载城市数据库
    if (fs.existsSync(CONFIG.geoIpDb.city)) {
      geoIpLookup.city = await maxmind.open(CONFIG.geoIpDb.city);
      console.log('已加载城市GeoIP数据库');
    }
    
    // 尝试加载国家数据库
    if (fs.existsSync(CONFIG.geoIpDb.country)) {
      geoIpLookup.country = await maxmind.open(CONFIG.geoIpDb.country);
      console.log('已加载国家GeoIP数据库');
    }
    
    // 尝试加载ASN数据库
    if (fs.existsSync(CONFIG.geoIpDb.asn)) {
      geoIpLookup.asn = await maxmind.open(CONFIG.geoIpDb.asn);
      console.log('已加载ASN GeoIP数据库');
    }
    
    geoIpLookup.initialized = true;
    return true;
  } catch (error) {
    console.error('初始化GeoIP数据库失败:', error);
    console.log('将使用本地IP段数据作为备选');
    return false;
  }
}

// 读取IP列表
async function readIpList(filePath) {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return data.split('\n').filter(line => line.trim() !== '');
  } catch (error) {
    console.error(`读取文件 ${filePath} 失败:`, error);
    return [];
  }
}

// 根据IP估算地区（增强版，优先使用GeoIP数据库）
async function estimateRegion(ip) {
  // 从IP中去除子网掩码部分
  const cleanIp = ip.split('/')[0].trim();
  
  // 1. 优先使用GeoIP数据库
  if (geoIpLookup.initialized) {
    try {
      let countryCode = null;
      let regionInfo = null;
      
      // 按优先级尝试查询: 城市 > 国家 > ASN
      if (geoIpLookup.city) {
        regionInfo = geoIpLookup.city.get(cleanIp);
        if (regionInfo && regionInfo.country) {
          countryCode = regionInfo.country.iso_code.toLowerCase();
        }
      }
      
      if (!countryCode && geoIpLookup.country) {
        regionInfo = geoIpLookup.country.get(cleanIp);
        if (regionInfo && regionInfo.country) {
          countryCode = regionInfo.country.iso_code.toLowerCase();
        }
      }
      
      if (countryCode) {
        console.log(`通过GeoIP查询到IP ${cleanIp} 位于 ${countryCode}`);
        return countryCode;
      }
    } catch (error) {
      console.error(`GeoIP查询错误: ${error.message}`);
      // 查询失败时，回退到本地IP段匹配
    }
  }
  
  // 2. 回退到IP段判断（当GeoIP不可用或查询失败时）
  
  // IP地址到国家/地区的映射表
  const ipRanges = [
    // 北美地区 - 美国
    { start: '103.21.244.0', end: '103.21.244.255', region: 'us', name: '美国' },
    { start: '103.22.200.0', end: '103.22.203.255', region: 'us', name: '美国' },
    { start: '103.31.4.0', end: '103.31.7.255', region: 'us', name: '美国' },
    { start: '104.16.0.0', end: '104.31.255.255', region: 'us', name: '美国' },
    { start: '108.162.192.0', end: '108.162.255.255', region: 'us', name: '美国' },
    { start: '131.0.72.0', end: '131.0.75.255', region: 'us', name: '美国' },
    { start: '162.158.0.0', end: '162.158.255.255', region: 'us', name: '美国' },
    { start: '172.64.0.0', end: '172.71.255.255', region: 'us', name: '美国' },
    { start: '173.245.48.0', end: '173.245.63.255', region: 'us', name: '美国' },
    { start: '198.41.128.0', end: '198.41.255.255', region: 'us', name: '美国' },
    
    // 欧洲地区
    { start: '141.101.64.0', end: '141.101.127.255', region: 'eu', name: '欧洲' },
    { start: '188.114.96.0', end: '188.114.111.255', region: 'eu', name: '欧洲' },
    
    // 亚洲地区
    { start: '1.0.0.0', end: '1.0.0.255', region: 'cn', name: '中国' },
    { start: '1.1.1.0', end: '1.1.1.255', region: 'au', name: '澳大利亚' },  // CloudFlare DNS
    { start: '43.249.72.0', end: '43.249.75.255', region: 'as', name: '亚洲' },
    
    // 南美地区
    { start: '190.93.240.0', end: '190.93.255.255', region: 'sa', name: '南美' },
    
    // 非洲地区
    { start: '197.234.240.0', end: '197.234.243.255', region: 'af', name: '非洲' },
    
    // 具体国家IP段 - 根据CloudFlare在各地的节点
    // 亚洲
    { start: '103.31.4.0', end: '103.31.7.255', region: 'jp', name: '日本' },
    { start: '103.22.200.0', end: '103.22.203.255', region: 'sg', name: '新加坡' },
    { start: '103.21.244.0', end: '103.21.244.255', region: 'hk', name: '香港' },
    { start: '45.64.64.0', end: '45.64.71.255', region: 'kr', name: '韩国' },
    { start: '103.31.8.0', end: '103.31.15.255', region: 'in', name: '印度' },
    
    // 欧洲
    { start: '104.93.0.0', end: '104.93.255.255', region: 'gb', name: '英国' },
    { start: '185.72.64.0', end: '185.72.71.255', region: 'de', name: '德国' },
    { start: '104.75.89.0', end: '104.75.89.255', region: 'fr', name: '法国' },
    { start: '195.242.120.0', end: '195.242.123.255', region: 'nl', name: '荷兰' },
    { start: '212.68.0.0', end: '212.68.255.255', region: 'it', name: '意大利' },
    { start: '94.102.160.0', end: '94.102.167.255', region: 'es', name: '西班牙' },
    
    // 北美
    { start: '192.230.64.0', end: '192.230.71.255', region: 'ca', name: '加拿大' },
    { start: '198.41.214.0', end: '198.41.214.255', region: 'mx', name: '墨西哥' },
    
    // 南美
    { start: '103.22.204.0', end: '103.22.207.255', region: 'br', name: '巴西' },
    { start: '103.21.240.0', end: '103.21.243.255', region: 'ar', name: '阿根廷' },
    { start: '190.93.244.0', end: '190.93.247.255', region: 'cl', name: '智利' },
    
    // 大洋洲
    { start: '103.22.208.0', end: '103.22.211.255', region: 'au', name: '澳大利亚' },
    { start: '103.21.248.0', end: '103.21.251.255', region: 'nz', name: '新西兰' },
    
    // IPv6地址段
    { start: '2400:cb00::', end: '2400:cb00:ffff:ffff:ffff:ffff:ffff:ffff', region: 'as', name: '亚洲' },
    { start: '2606:4700::', end: '2606:4700:ffff:ffff:ffff:ffff:ffff:ffff', region: 'us', name: '美国' },
    { start: '2803:f800::', end: '2803:f800:ffff:ffff:ffff:ffff:ffff:ffff', region: 'sa', name: '南美' },
    { start: '2405:b500::', end: '2405:b500:ffff:ffff:ffff:ffff:ffff:ffff', region: 'as', name: '亚洲' },
    { start: '2a06:98c0::', end: '2a06:98c0:ffff:ffff:ffff:ffff:ffff:ffff', region: 'eu', name: '欧洲' },
    
    // 更具体的IPv6地址段
    { start: '2400:cb00:30::', end: '2400:cb00:30:ffff:ffff:ffff:ffff:ffff', region: 'jp', name: '日本' },
    { start: '2400:cb00:40::', end: '2400:cb00:40:ffff:ffff:ffff:ffff:ffff', region: 'sg', name: '新加坡' },
    { start: '2606:4700:10::', end: '2606:4700:10:ffff:ffff:ffff:ffff:ffff', region: 'us', name: '美国-西部' },
    { start: '2606:4700:20::', end: '2606:4700:20:ffff:ffff:ffff:ffff:ffff', region: 'us', name: '美国-东部' },
    { start: '2a06:98c0:3900::', end: '2a06:98c0:3900:ffff:ffff:ffff:ffff:ffff', region: 'gb', name: '英国' },
    { start: '2a06:98c0:3a00::', end: '2a06:98c0:3a00:ffff:ffff:ffff:ffff:ffff', region: 'de', name: '德国' },
    
    // CloudFlare企业级IP段
    { start: '199.27.128.0', end: '199.27.135.255', region: 'us', name: '美国-企业' },
    { start: '2a06:98c1::', end: '2a06:98c1:ffff:ffff:ffff:ffff:ffff:ffff', region: 'eu', name: '欧洲-企业' },
  ];

  // 转换IPv4地址为数字便于比较
  function ipv4ToNumber(ipStr) {
    const parts = ipStr.split('.');
    return ((parseInt(parts[0], 10) << 24) |
            (parseInt(parts[1], 10) << 16) |
            (parseInt(parts[2], 10) << 8) |
            parseInt(parts[3], 10)) >>> 0;
  }

  // 判断IPv6地址是否在指定范围内
  function isIPv6InRange(ip, start, end) {
    // 简单实现，仅根据前缀匹配
    // 实际应用中可能需要更精确的IPv6地址比较
    return ip.startsWith(start.split(':')[0]);
  }

  // 判断IP是否为IPv6
  const isIpv6 = cleanIp.includes(':');

  if (isIpv6) {
    // 处理IPv6地址
    for (const range of ipRanges) {
      if (range.start.includes(':') && isIPv6InRange(cleanIp, range.start, range.end)) {
        console.log(`通过IP段判断: ${cleanIp} 位于 ${range.region} (${range.name})`);
        return range.region;
      }
    }
  } else {
    // 处理IPv4地址
    const ipNum = ipv4ToNumber(cleanIp);
    for (const range of ipRanges) {
      if (!range.start.includes(':') && 
          ipNum >= ipv4ToNumber(range.start) && 
          ipNum <= ipv4ToNumber(range.end)) {
        console.log(`通过IP段判断: ${cleanIp} 位于 ${range.region} (${range.name})`);
        return range.region;
      }
    }
  }

  // 3. 增加基于延迟的启发式判断
  // 在测试延迟后可以进一步完善此部分

  // 如果没有匹配，返回未知
  console.log(`无法确定IP ${cleanIp} 的地区`);
  return 'unknown';
}

// 测试单个IP的延迟
async function testIpLatency(ip) {
  try {
    // 从CIDR格式提取IP
    const baseIp = ip.split('/')[0];
    console.log(`开始测试IP: ${baseIp}`);
    
    // 使用ping命令测试延迟
    const pingCount = CONFIG.testCount;
    const pingTimeout = Math.floor(CONFIG.timeout / 1000);
    
    // 根据IP类型选择ping命令
    const isIpv6 = baseIp.includes(':');
    const pingCmd = isIpv6 ? 
      `ping6 -c ${pingCount} -W ${pingTimeout} ${baseIp}` : 
      `ping -c ${pingCount} -W ${pingTimeout} ${baseIp}`;
    
    console.log(`执行命令: ${pingCmd}`);
    
    const { stdout, stderr } = await execPromise(pingCmd);
    
    if (stderr) {
      console.error(`Ping错误: ${stderr}`);
    }
    
    console.log(`Ping输出: ${stdout.substring(0, 100)}...`);
    
    // 解析ping结果，提取平均延迟
    const avgMatch = stdout.match(/min\/avg\/max(?:\/mdev)? = [\d.]+\/([\d.]+)/);
    if (avgMatch && avgMatch[1]) {
      const avgLatency = parseFloat(avgMatch[1]);
      
      // 通过GeoIP或IP段估算地区
      const region = await estimateRegion(baseIp);
      
      console.log(`IP ${baseIp} 测试成功，延迟: ${avgLatency.toFixed(2)}ms，区域: ${region}`);
      
      return {
        ip: ip,
        baseIp: baseIp, // 保存原始IP，不含CIDR
        latency: avgLatency,
        region: region,
        isIpv6: isIpv6,
        status: 'success'
      };
    }
    
    console.log(`IP ${baseIp} ping测试失败，无法解析结果`);
    return { 
      ip: ip, 
      baseIp: baseIp,
      latency: 9999, 
      region: 'unknown', 
      isIpv6: isIpv6, 
      status: 'parse_failed' 
    };
  } catch (error) {
    const baseIp = ip.split('/')[0];
    console.error(`IP ${baseIp} 测试错误: ${error.message}`);
    
    const region = await estimateRegion(baseIp);
    
    console.log(`IP ${baseIp} ping测试超时，地区: ${region}`);
    return { 
      ip: ip, 
      baseIp: baseIp,
      latency: 9999, 
      region: region, 
      isIpv6: baseIp.includes(':'), 
      status: 'timeout' 
    };
  }
}

// 批量测试IP
async function batchTestIps(ipList) {
  const results = [];
  const totalIps = ipList.length;
  
  console.log(`开始测试 ${totalIps} 个IP...`);
  
  // 分批测试，避免同时发起太多请求
  for (let i = 0; i < totalIps; i += CONFIG.concurrentTests) {
    const batch = ipList.slice(i, i + CONFIG.concurrentTests);
    console.log(`测试批次 ${Math.floor(i/CONFIG.concurrentTests) + 1}, IP数量: ${batch.length}`);
    
    // 记录本批次所有IP
    batch.forEach(ip => console.log(`准备测试IP: ${ip}`));
    
    const batchPromises = batch.map(ip => testIpLatency(ip));
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // 显示进度和成功率
    const successCount = batchResults.filter(r => r.status === 'success').length;
    console.log(`批次完成: ${Math.min(i + CONFIG.concurrentTests, totalIps)}/${totalIps}, 成功率: ${successCount}/${batch.length}`);
  }
  
  // 打印所有成功的结果
  const successResults = results.filter(r => r.status === 'success');
  console.log(`测试完成，成功测试IP数量: ${successResults.length}/${totalIps}`);
  successResults.forEach(result => {
    console.log(`成功的IP: ${result.ip}, 延迟: ${result.latency.toFixed(2)}ms, 地区: ${result.region}`);
  });
  
  return results;
}

// 按区域分组IP
function groupIpsByRegion(results) {
  const grouped = {};
  
  results.forEach(result => {
    if (!grouped[result.region]) {
      grouped[result.region] = [];
    }
    grouped[result.region].push(result);
  });
  
  // 每个区域内按延迟排序
  Object.keys(grouped).forEach(region => {
    grouped[region].sort((a, b) => a.latency - b.latency);
  });
  
  return grouped;
}

// 生成优化后的IP列表
function generateOptimizedList(groupedResults) {
  const regions = Object.keys(groupedResults);
  const perRegionCount = Math.floor(CONFIG.topCount / regions.length);
  let optimizedList = [];
  
  // 添加文件头信息
  optimizedList.push(`# CloudFlare IP优选结果`);
  optimizedList.push(`# 优选时间: ${new Date().toLocaleString()}`);
  optimizedList.push(`# 每个国家/地区选取 ${CONFIG.topCount} 个最优IP`);
  optimizedList.push('');
  
  // 从每个区域选取最佳IP
  regions.forEach(region => {
    const regionIps = groupedResults[region]
      .filter(result => result.status === 'success')
      .slice(0, perRegionCount);
    
    if (regionIps.length > 0) {
      const regionName = regionNames[region] || region.toUpperCase();
      optimizedList.push(`# ${regionName} 地区`);
      regionIps.forEach(result => {
        // 从CIDR格式提取IP
        const baseIp = result.ip.split('/')[0];
        // 添加端口号（默认为443，因为Cloudflare通常使用HTTPS）
        optimizedList.push(`${baseIp}:443#${region} # 延迟: ${result.latency.toFixed(2)}ms`);
        // 添加调试信息
        console.log(`添加优选IP: ${baseIp}:443#${region} (延迟: ${result.latency.toFixed(2)}ms)`);
      });
      optimizedList.push('');  // 添加空行分隔
    }
  });
  
  // 添加使用说明
  optimizedList.push(`# 使用说明`);
  optimizedList.push(`# 1. 这些IP是通过延迟测试优选出来的，可用于CloudFlare CDN加速`);
  optimizedList.push(`# 2. 格式为: IP:端口#国家或地区`);
  optimizedList.push(`# 3. 建议定期重新优选，以获取最佳体验`);
  
  return optimizedList.join('\n');
}

// 主函数
async function main() {
  console.log('开始IP优选测试...');
  
  // 初始化GeoIP数据库
  await initGeoIpDb();
  
  // 读取IPv4和IPv6列表
  const [ipv4List, ipv6List] = await Promise.all([
    readIpList(CONFIG.ipv4File),
    readIpList(CONFIG.ipv6File)
  ]);
  
  console.log(`读取到 ${ipv4List.length} 个IPv4地址和 ${ipv6List.length} 个IPv6地址`);
  
  // 合并IP列表并随机选择一部分进行测试以节省时间
  const combinedList = [...ipv4List, ...ipv6List];
  const shuffled = combinedList.sort(() => 0.5 - Math.random());
  const sampleSize = Math.min(combinedList.length, 500); // 最多测试500个IP
  const testList = shuffled.slice(0, sampleSize);
  
  console.log(`将测试 ${testList.length} 个IP地址...`);
  
  // 测试IP
  const results = await batchTestIps(testList);
  
  // 过滤成功的结果
  const successResults = results.filter(r => r.status === 'success');
  console.log(`测试完成，${successResults.length} 个IP可达`);
  
  // 按区域分组
  const groupedResults = groupIpsByRegion(successResults);
  
  // 生成优化列表
  const optimizedList = generateOptimizedList(groupedResults);
  
  // 保存结果
  await fs.promises.writeFile(CONFIG.outputFile, optimizedList);
  console.log(`已将优选IP保存至 ${CONFIG.outputFile}`);
}

main().catch(console.error);