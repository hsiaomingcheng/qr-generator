import { describe, expect, it } from 'vitest'
import { isInAppBrowser } from '../src/lib/inAppBrowser'

const UA = {
  lineIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/14.5.0',
  lineAndroid:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 Line/14.5.0',
  facebookIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0.0.38.108;FBBV/565678923;FBDV/iPhone14,5;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBID/phone;FBLC/zh_TW;FBOP/5]',
  facebookAndroid:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0.0.38.108;]',
  instagram:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.4.18.89 (iPhone14,5; iOS 17_4; zh_TW; zh-Hant-TW; scale=3.00; 1170x2532; 560000000)',
  weChat:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.47.2560',
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  desktopChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

describe('isInAppBrowser', () => {
  it.each(['lineIos', 'lineAndroid', 'facebookIos', 'facebookAndroid', 'instagram', 'weChat'] as const)(
    'detects %s',
    (name) => {
      expect(isInAppBrowser(UA[name])).toBe(true)
    },
  )

  it.each(['iphoneSafari', 'androidChrome', 'desktopChrome'] as const)(
    'does not flag %s',
    (name) => {
      expect(isInAppBrowser(UA[name])).toBe(false)
    },
  )

  it('does not match "line/" inside another token', () => {
    expect(isInAppBrowser('Mozilla/5.0 Baseline/1.0 Chrome/120.0')).toBe(false)
  })

  it('returns false for an empty user agent', () => {
    expect(isInAppBrowser('')).toBe(false)
  })
})
