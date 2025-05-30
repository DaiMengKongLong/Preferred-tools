const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// 配置参数
const CONFIG = {
  ipv4File: 'ips-v4.txt',
  ipv6File: 'ips-v6.txt',
  concurrentTests: 10,  // 并发测试数量
  testCount: 3,         // 每个IP测试次数
  timeout: 1000,        // 超时时间(ms)
  topCount: 50,         // 选取的优质IP数量
  outputFile: 'optimized-ips.txt'  // 输出文件
};

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

// 测试单个IP的延迟
async function testIpLatency(ip) {
  try {
    // 从CIDR格式提取IP
    const baseIp = ip.split('/')[0];
    
    // 使用ping命令测试延迟
    const pingCount = CONFIG.testCount;
    const pingTimeout = Math.floor(CONFIG.timeout / 1000);
    
    // 根据IP类型选择ping命令
    const isIpv6 = baseIp.includes(':');
    const pingCmd = isIpv6 ? 
      `ping6 -c ${pingCount} -W ${pingTimeout} ${baseIp}` : 
      `ping -c ${pingCount} -W ${pingTimeout} ${baseIp}`;
    
    const { stdout } = await execPromise(pingCmd);
    
    // 解析ping结果，提取平均延迟
    const avgMatch = stdout.match(/min\/avg\/max(?:\/mdev)? = [\d.]+\/([\d.]+)/);
    if (avgMatch && avgMatch[1]) {
      const avgLatency = parseFloat(avgMatch[1]);
      
      // 检测地理位置 (简单估计，实际应使用GeoIP数据库)
      let region = 'unknown';
      if (avgLatency < 50) region = 'local';
      else if (avgLatency < 100) region = 'hk'; // 香港
      else if (avgLatency < 150) region = 'jp'; // 日本
      else if (avgLatency < 200) region = 'sg'; // 新加坡
      else region = 'us'; // 美国或其他远距离地区
      
      return {
        ip: ip,
        latency: avgLatency,
        region: region,
        isIpv6: isIpv6,
        status: 'success'
      };
    }
    
    return { ip: ip, latency: 9999, region: 'unknown', isIpv6: isIpv6, status: 'parse_failed' };
  } catch (error) {
    return { ip: ip, latency: 9999, region: 'unknown', isIpv6: baseIp.includes(':'), status: 'timeout' };
  }
}

// 批量测试IP
async function batchTestIps(ipList) {
  const results = [];
  const totalIps = ipList.length;
  
  // 分批测试，避免同时发起太多请求
  for (let i = 0; i < totalIps; i += CONFIG.concurrentTests) {
    const batch = ipList.slice(i, i + CONFIG.concurrentTests);
    const batchPromises = batch.map(ip => testIpLatency(ip));
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // 显示进度
    console.log(`测试进度: ${Math.min(i + CONFIG.concurrentTests, totalIps)}/${totalIps}`);
  }
  
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
  
  // 从每个区域选取最佳IP
  regions.forEach(region => {
    const regionIps = groupedResults[region]
      .filter(result => result.status === 'success')
      .slice(0, perRegionCount);
    
    if (regionIps.length > 0) {
      optimizedList.push(`# ${region.toUpperCase()} 地区`);
      regionIps.forEach(result => {
        optimizedList.push(`${result.ip} # 延迟: ${result.latency.toFixed(2)}ms`);
      });
      optimizedList.push('');  // 添加空行分隔
    }
  });
  
  return optimizedList.join('\n');
}

// 主函数
async function main() {
  console.log('开始IP优选测试...');
  
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