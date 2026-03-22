'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Post = {
  id: number
  title: string
  created_at: string
}

export default function Home() {
  const [title, setTitle] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('불러오기 오류:', error.message)
      return
    }

    setPosts(data ?? [])
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  async function handleSave() {
    if (!title.trim()) return

    setLoading(true)

    const { error } = await supabase.from('posts').insert({
      title: title.trim(),
    })

    setLoading(false)

    if (error) {
      console.error('저장 오류:', error.message)
      alert('저장 실패')
      return
    }

    setTitle('')
    fetchPosts()
  }

  async function handleDelete(id: number) {
    setDeletingId(id)

    const { error } = await supabase.from('posts').delete().eq('id', id)

    setDeletingId(null)

    if (error) {
      console.error('삭제 오류:', error.message)
      alert('삭제 실패')
      return
    }

    fetchPosts()
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 text-3xl font-bold">프로젝트 A</h1>
        <p className="mb-6 text-gray-300">Supabase 연결 테스트</p>

        <div className="mb-6 flex gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 입력"
            className="flex-1 rounded border border-gray-600 bg-black px-4 py-2 text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave()
              }
            }}
          />
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded bg-white px-4 py-2 font-semibold text-black disabled:opacity-50"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>

        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-gray-400">아직 저장된 데이터가 없습니다.</p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="flex items-start justify-between rounded border border-gray-700 p-4"
              >
                <div>
                  <p className="font-medium">{post.title}</p>
                  <p className="text-sm text-gray-400">
                    {formatDate(post.created_at)}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                  className="rounded border border-red-400 px-3 py-1 text-sm text-red-300 disabled:opacity-50"
                >
                  {deletingId === post.id ? '삭제 중...' : '삭제'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}