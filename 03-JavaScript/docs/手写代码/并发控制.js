// 题目：提供一个urls请求数组，指定最多只能同时发送max个，要求最终请求结果和urls数组一一对应
const urls = [
  'http://www.baidu.com?id=100',
  'http://www.baidu.com?id=101',
  'http://www.baidu.com?id=102',
  'http://www.baidu.com?id=103',
  'http://www.baidu.com?id=104',
  'http://www.baidu.com?id=105',
  'http://www.baidu.com?id=106',
  'http://www.baidu.com?id=107',
  'http://www.baidu.com?id=108',
  'http://www.baidu.com?id=109',
  'http://www.baidu.com?id=110',
  'http://www.baidu.com?id=111',
  'http://www.baidu.com?id=112'
]
function runRequest (url) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(url)
    }, 1000 * Math.random())
  })
}
function multiRequest (urls, max = 1) {
  let requestedCount = 0
  let requestIndex = 0
  const requestList = urls.slice()
  const res = []
  return new Promise((resolve, reject) => {
    const request = (url, index) => {
      if (index > requestList.length - 1) {
        return
      }
      requestIndex++
      runRequest(url).then(data => {
        res[index] = `data:${data}`
        requestedCount++
        console.log('success:' + url)
        console.log(requestIndex, requestedCount)
        if (requestedCount >= urls.length) {
          return resolve(res)
        } else {
          request(requestList[requestIndex], requestIndex)
        }
      })
    }
    for (let index = 0; index < max; index++) {
      request(requestList[index], index)
    }
  })
}

multiRequest(urls, 3).then(res => {
  console.log(res)
})
