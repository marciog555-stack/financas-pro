import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#08090d',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 140,
            height: 140,
            borderRadius: 32,
            background: '#059669',
            fontSize: 72,
            fontWeight: 700,
            marginBottom: 32,
          }}
        >
          $
        </div>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700 }}>Finanças Pro</div>
        <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>
          Controle financeiro do casal
        </div>
      </div>
    ),
    { ...size }
  )
}
