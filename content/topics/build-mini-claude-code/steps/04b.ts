export type ToolName = 'getWeather' | 'getTime'
export type ToolFn = (input: string) => Promise<string>

function mockWeather(city: string, time: string): string {
  const conditions = ['晴', '多云', '阴', '小雨', '阵雨']
  const seed = Array.from(`${city}|${time}`).reduce(
    (acc, ch) => acc + ch.charCodeAt(0),
    0,
  )
  const condition = conditions[seed % conditions.length] ?? '晴'
  const temp = 12 + (seed % 20)
  return `天气信息：${city} 在 ${time} 的天气为${condition}，气温 ${temp}°C。`
}

export const TOOLKIT: Record<ToolName, ToolFn> = {
  async getTime() {
    return new Date().toISOString()
  },

  async getWeather(input: string) {
    try {
      const { city, time } = JSON.parse(input)
      if (typeof city !== 'string' || typeof time !== 'string') {
        return 'getWeather 需要 JSON 参数：{"city":"上海","time":"2026-02-27 10:00"}'
      }
      return mockWeather(city.trim(), time.trim())
    } catch {
      return 'getWeather 参数必须是 JSON 字符串'
    }
  },
}
