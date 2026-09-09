import { ImageResponse } from 'next/og'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#059669',
          color: 'white',
          fontSize: 290,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        $
      </div>
    ),
    { width: 512, height: 512 }
  )
}
