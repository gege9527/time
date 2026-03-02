const timer = async () => {
  const notices = []
  if (!process.env.TOKEN) return notices
  
  for (const cookie of String(process.env.TOKEN).split('\n')) {
    if (!cookie) continue
    
    try {
      notices.push({
        status: 'success',
        title: '✅ 签到成功',
        message: `${cookie || '签到成功'}`,
        details: `<${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}>`
      })
    } catch (error) {
      notices.push({
        status: 'error',
        title: '❌ 签到失败',
        message: `${error.message || error}`,
        details: `<${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}>`
      })
    }
  }
  
  return notices
}

const formatNoticeMessage = (notices) => {
  if (!notices || notices.length === 0) {
    return '<font color="warning">⚠️ 未检测到任何签到任务</font>'
  }
  
  const successCount = notices.filter(n => n.status === 'success').length
  const errorCount = notices.filter(n => n.status === 'error').length
  
  let message = ''
  
  // 添加详细信息
  const detailMessages = notices.map(notice => {
    if (notice.status === 'success') {
      return `✅ ${notice.title}
> 账号:<font color="comment">${notice.message}</font>
> 状态:<font color="info">签到成功</font>
> 时间:<font color="comment">${new Date().toLocaleString('zh-CN')}</font>`
    } else {
      return `❌ ${notice.title}
> 账号:<font color="comment">${notice.message}</font>
> 状态:<font color="warning">签到失败</font>
> 时间:<font color="comment">${new Date().toLocaleString('zh-CN')}</font>
> 详情:${notice.details || '无'}`
    }
  })
  
  if (detailMessages.length > 0) {
    message += '\n---\n\n' + detailMessages.join('\n\n---\n\n')
  }
  
  return message
}

const notify = async (notices) => {
  if (!process.env.NOTIFY || !notices) return
  
  const formattedMessage = formatNoticeMessage(notices)
  console.log('准备发送的通知内容:', formattedMessage)
  
  for (const qyweixinToken of String(process.env.NOTIFY).split('\n')) {
    if (!qyweixinToken) continue
    
    try {
      // 修正：应该从环境变量中提取token，而不是硬编码
      const token = qyweixinToken.includes(':') ? qyweixinToken.split(':')[1] : qyweixinToken
      const qyweixinNotifyRebotUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${token}`
      
      console.log('发送到URL:', qyweixinNotifyRebotUrl)
      
      const response = await fetch(qyweixinNotifyRebotUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: {
            content: formattedMessage
          }
        }),
      })
      
      // 添加响应状态检查
      const responseBody = await response.text()
      console.log('企业微信响应状态:', response.status)
      console.log('企业微信响应内容:', responseBody)
      
      if (response.ok) {
        console.log('✅ 企业微信通知发送成功')
      } else {
        console.error('❌ 企业微信通知发送失败:', response.status, responseBody)
      }
    } catch (error) {
      console.error('❌ 企业微信通知发送异常:', error.message || error)
    }
  }
}

const main = async () => {
  try {
    const notices = await timer()
    await notify(notices)
  } catch (error) {
    console.error('❌ 主程序执行失败:', error.message || error)
  }
}

main()