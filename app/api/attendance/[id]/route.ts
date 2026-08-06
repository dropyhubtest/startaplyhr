import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ message: `Get attendance ${params.id}` })
}
