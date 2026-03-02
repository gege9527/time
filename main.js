const timer = async () => {
  const notices = []
  if (!process.env.TOKEN) return notices
  
  for (const cookie of String(process.env.TOKEN).split('\n')) {
    if (!cookie) continue
    
    try {
      notices.push({
        status: 'success',
        title: '✅ 签到成功',
        message: `${cookie || '签到成功'}`
      })
      notices.push({
        status: 'error',
        title: '❌ 签到失败',
        message: `${cookie}`,
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
    return '⚠️ 未检测到任何签到任务'
  }
  
  const messages = notices.map(notice => {
    return `${notice.title}\n> ${notice.message}\n> ${notice.details}`
  })
  
  return messages.join('\n\n---\n\n')
}

const notify = async (notices) => {
  if (!process.env.NOTIFY || !notices) return
  
  const formattedMessage = formatNoticeMessage(notices)
  
  for (const qyweixinToken of String(process.env.NOTIFY).split('\n')) {
    if (!qyweixinToken) continue
    
    try {
      const qyweixinNotifyRebotUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${qyweixinToken}`
      await fetch(qyweixinNotifyRebotUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'markdown',
          markdown: {
            content: formattedMessage
          }
        }),
      })
      
      console.log('✅ 企业微信通知发送成功')
    } catch (error) {
      console.error('❌ 企业微信通知发送失败:', error.message || error)
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