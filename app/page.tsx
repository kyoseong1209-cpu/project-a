'use client'

import { useEffect, useState } from 'react'
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

export default function Home() {
  const [studentName, setStudentName] = useState('')
  const [lessonTopic, setLessonTopic] = useState('')
  const [homework, setHomework] = useState('')
  const [nextCheckpoint, setNextCheckpoint] = useState('')
  const [createdAt, setCreatedAt] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [records, setRecords] = useState<LessonRecord[]>([])
  const [studentList, setStudentList] = useState<string[]>([])
  const [selectedStudent, setSelectedStudent] = useState('전체')
  const [loading, setLoading] = useState(false)

  async function fetchRecords(student?: string) {
    let query = supabase
      .from('lesson_records')
      .select('*')
      .order('id', { ascending: false })

    if (student && student !== '전체') {
      query = query.eq('student_name', student)
    }

    const { data, error } = await query

    if (error) {
      console.error('조회 오류:', error)
      return
    }

    setRecords(data ?? [])
  }

  async function fetchStudentList() {
    const { data, error } = await supabase
      .from('lesson_records')
      .select('student_name')
      .order('student_name', { ascending: true })

    if (error) {
      console.error('학생 목록 조회 오류:', error)
      return
    }

    const uniqueNames = Array.from(
      new Set((data ?? []).map((item) => item.student_name))
    )

    setStudentList(uniqueNames)
  }

  async function addRecord() {
    if (!studentName.trim() || !lessonTopic.trim()) {
      alert('학생 이름과 수업 주제는 꼭 입력해야 해.')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('lesson_records').insert([
      {
        student_name: studentName,
        lesson_topic: lessonTopic,
        homework,
        next_checkpoint: nextCheckpoint,
        created_at: createdAt,
      },
    ])

    setLoading(false)

    if (error) {
      console.error('저장 오류:', error)
      alert('저장 실패')
      return
    }

    setStudentName('')
    setLessonTopic('')
    setHomework('')
    setNextCheckpoint('')
    setCreatedAt(new Date().toISOString().slice(0, 10))

    await fetchStudentList()
    await fetchRecords(selectedStudent)
  }

  async function deleteRecord(id: number) {
    const { error } = await supabase
      .from('lesson_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('삭제 오류:', error)
      alert('삭제 실패')
      return
    }

    await fetchStudentList()
    await fetchRecords(selectedStudent)
  }

  useEffect(() => {
    fetchStudentList()
    fetchRecords()
  }, [])

  useEffect(() => {
    fetchRecords(selectedStudent)
  }, [selectedStudent])

  return (
    <main style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
        학생별 수업 기록 앱
      </h1>

      <div
        style={{
          display: 'grid',
          gap: '12px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '12px',
          marginBottom: '32px',
        }}
      >
        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="학생 이름"
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <input
          value={lessonTopic}
          onChange={(e) => setLessonTopic(e.target.value)}
          placeholder="수업 주제"
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <textarea
          value={homework}
          onChange={(e) => setHomework(e.target.value)}
          placeholder="숙제"
          rows={4}
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <textarea
          value={nextCheckpoint}
          onChange={(e) => setNextCheckpoint(e.target.value)}
          placeholder="다음 시간 체크포인트"
          rows={4}
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <input
          type="date"
          value={createdAt}
          onChange={(e) => setCreatedAt(e.target.value)}
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <button
          onClick={addRecord}
          disabled={loading}
          style={{
            padding: '12px',
            fontSize: '16px',
            backgroundColor: 'black',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          {loading ? '저장 중...' : '기록 저장'}
        </button>
      </div>

      <div
        style={{
          marginBottom: '24px',
          padding: '16px',
          border: '1px solid #ddd',
          borderRadius: '12px',
        }}
      >
        <label
          htmlFor="student-filter"
          style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
        >
          학생 필터
        </label>
        <select
          id="student-filter"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          style={{ padding: '12px', fontSize: '16px', width: '100%' }}
        >
          <option value="전체">전체</option>
          {studentList.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px' }}>
        저장된 기록
      </h2>

      <div style={{ display: 'grid', gap: '16px' }}>
        {records.length === 0 ? (
          <p>표시할 기록이 없습니다.</p>
        ) : (
          records.map((record) => (
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

              <button
                onClick={() => deleteRecord(record.id)}
                style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  backgroundColor: 'crimson',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  )
}