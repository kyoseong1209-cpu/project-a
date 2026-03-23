'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

type LessonRecord = {
  id: number
  student_name: string
  lesson_topic: string
  homework: string | null
  next_checkpoint: string | null
  created_at: string
}

export default function StudentDetailPage() {
  const params = useParams<{ studentName: string }>()
  const studentName = decodeURIComponent(params.studentName)

  const [records, setRecords] = useState<LessonRecord[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchStudentRecords() {
    const { data, error } = await supabase
      .from('lesson_records')
      .select('*')
      .eq('student_name', studentName)
      .order('id', { ascending: false })

    if (error) {
      console.error('학생 기록 조회 오류:', error)
      setLoading(false)
      return
    }

    setRecords(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!studentName) return
    fetchStudentRecords()
  }, [studentName])

  return (
    <main style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>
          ← 홈으로 돌아가기
        </Link>
      </div>

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
        {studentName} 학생 기록
      </h1>

      {loading ? (
        <p>불러오는 중...</p>
      ) : records.length === 0 ? (
        <p>이 학생의 기록이 없습니다.</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {records.map((record) => (
            <div
              key={record.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <p><strong>학생 이름:</strong> {record.student_name}</p>
              <p><strong>수업 주제:</strong> {record.lesson_topic}</p>
              <p><strong>숙제:</strong> {record.homework || '-'}</p>
              <p><strong>다음 시간 체크포인트:</strong> {record.next_checkpoint || '-'}</p>
              <p><strong>작성일:</strong> {record.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}