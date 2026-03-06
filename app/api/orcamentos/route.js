import { NextResponse } from 'next/server'
import { getList, setList, KEYS } from '../../../lib/kv'

export async function GET() {
  const data = await getList(KEYS.orcamentos)
  return NextResponse.json(data)
}

export async function POST(req) {
  const body = await req.json()
  const list = await getList(KEYS.orcamentos)
  const next = [body, ...list]
  await setList(KEYS.orcamentos, next)
  return NextResponse.json(next)
}

export async function PUT(req) {
  const body = await req.json()
  const list = await getList(KEYS.orcamentos)
  const next = list.map(o => o.id === body.id ? body : o)
  await setList(KEYS.orcamentos, next)
  return NextResponse.json(next)
}

export async function DELETE(req) {
  const { id } = await req.json()
  const list = await getList(KEYS.orcamentos)
  const next = list.filter(o => o.id !== id)
  await setList(KEYS.orcamentos, next)
  return NextResponse.json(next)
}
