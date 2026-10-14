import React, { useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Model from '../components/Model';
import { BsEmojiSmile, BsFillEmojiSmileFill } from "react-icons/bs"
import { fetchMessages, sendMessage } from '../apis/messages';
import { useEffect } from 'react';
import MessageHistory from '../components/MessageHistory';
import "./home.css"
import { fetchChats, refreshChats, setNotifications } from '../redux/chatsSlice';
import Loading from '../components/ui/Loading';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { getChatName } from '../utils/logics';
import { validUser } from '../apis/auth';

function Chat(props) {
  const { activeChat, notifications, chats } = useSelector((state) => state.chats)
  const dispatch = useDispatch()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPicker, setShowPicker] = useState(false);
  const activeUser = useSelector((state) => state.activeUser)
  const messagesRef = useRef([])
  const seenRef = useRef({})
  const activeIdRef = useRef(null)
  const notifRef = useRef([])
  notifRef.current = notifications
  activeIdRef.current = activeChat?._id

  const keyDownFunction = async (e) => {
    if ((e.key === "Enter" || e.type === "click") && message.trim()) {
      const text = message
      setMessage("")
      const data = await sendMessage({ chatId: activeChat._id, message: text })
      if (data) setMessages((prev) => [...prev, data])
      dispatch(fetchChats())
    }
  }

  useEffect(() => { messagesRef.current = messages }, [messages])

  // Muat riwayat saat ganti chat
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!activeChat) return
      setLoading(true)
      const data = await fetchMessages(activeChat._id)
      if (!cancelled) {
        setMessages(Array.isArray(data) ? data : [])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat?._id])

  // Pengganti Socket.io (Vercel tidak mendukung WebSocket): polling pesan baru tiap 3 detik
  useEffect(() => {
    if (!activeChat) return
    const id = setInterval(async () => {
      if (document.hidden) return
      const last = messagesRef.current[messagesRef.current.length - 1]
      const fresh = await fetchMessages(activeChat._id, last?.createdAt)
      if (Array.isArray(fresh) && fresh.length) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m._id))
          const add = fresh.filter((m) => !ids.has(m._id))
          return add.length ? [...prev, ...add] : prev
        })
      }
    }, 3000)
    return () => clearInterval(id)
  }, [activeChat?._id])

  // Polling daftar chat tiap 5 detik untuk pesan masuk di chat lain
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) dispatch(refreshChats())
    }, 5000)
    return () => clearInterval(id)
  }, [dispatch])

  useEffect(() => {
    if (!Array.isArray(chats) || !activeUser?.id) return
    const first = Object.keys(seenRef.current).length === 0
    const fresh = []
    chats.forEach((c) => {
      const lm = c.latestMessage
      if (!lm) return
      const prevId = seenRef.current[c._id]
      seenRef.current[c._id] = lm._id
      if (first || prevId === lm._id) return
      if (lm.sender?._id === activeUser.id) return
      if (c._id === activeIdRef.current) return
      fresh.push({ ...lm, chatId: c })
    })
    if (fresh.length) dispatch(setNotifications([...fresh, ...notifRef.current]))
  }, [chats, activeUser?.id, dispatch])

  useEffect(() => {
    const isValid = async () => {
      const data = await validUser()
      if (!data?.user) {
        window.location.href = "/login"
      }
    }
    isValid()
  }, [])
  if (loading) {
    return <div className={props.className}>
      <Loading />
    </div>
  }
  return (
    <>
      {
        activeChat ?
          <div className={props.className}>
            <div className='flex justify-between items-center px-5 bg-[#ffff] w-[100%]'>
              <div className='flex items-center gap-x-[10px]'>
                <div className='flex flex-col items-start justify-center'>
                  <h5 className='text-[17px] text-[#2b2e33] font-bold tracking-wide'>{getChatName(activeChat, activeUser)}</h5>
                  {/* <p className='text-[11px] text-[#aabac8]'>Last seen 5 min ago</p> */}
                </div>
              </div>
              <div>
                <Model />
              </div>
            </div>
            <div className='scrollbar-hide w-[100%] h-[70vh] md:h-[66vh] lg:h-[69vh] flex flex-col overflow-y-scroll p-4'>
              <MessageHistory messages={messages} />
              
            </div>
            <div className='absolute left-[31%] bottom-[8%]'>
              {
                showPicker && <Picker data={data} onEmojiSelect={(e) => setMessage(message + e.native)} />
              }
              <div className='border-[1px] border-[#aabac8] px-6 py-3 w-[360px] sm:w-[400px] md:w-[350px] h-[50px] lg:w-[400px] rounded-t-[10px]'>

                <form onKeyDown={(e) => keyDownFunction(e)} onSubmit={(e) => e.preventDefault()}>
                  <input onChange={(e) => setMessage(e.target.value)} className='focus:outline-0 w-[100%] bg-[#f8f9fa]' type="text" name="message" placeholder="Enter message" value={message} />
                </form>

              </div>

              <div className='border-x-[1px] border-b-[1px] bg-[#f8f9fa] border-[#aabac8] px-6 py-3 w-[360px] sm:w-[400px] md:w-[350px] lg:w-[400px] rounded-b-[10px] h-[50px]'>
                {/* {
                  isTyping ? <div>Loading</div> : ""
                } */}
                <div className='flex justify-between items-start'>

                  <div className='cursor-pointer' onClick={() => setShowPicker(!showPicker)}>

                    {showPicker ? <BsFillEmojiSmileFill className='w-[20px] h-[20px] text-[#ffb02e] border-[black]' /> : <BsEmojiSmile className='w-[20px] h-[20px]' />}
                  </div>
                  <button onClick={(e) => keyDownFunction(e)} className='bg-[#f8f9fa] border-[2px] border-[#d4d4d4] text-[14px] px-2 py-[3px] text-[#9e9e9e] font-medium rounded-[7px] -mt-1'>Send</button>
                </div>
              </div>
            </div>
          </div> :
          <div className={props.className}>
            <div className='relative'>
              <div className='absolute top-[40vh] left-[44%] flex flex-col items-center justify-center gap-y-3'>
                <img className='w-[50px] h-[50px] rounded-[25px]' alt="User profile" src={activeUser.profilePic} />
                <h3 className='text-[#111b21] text-[20px] font-medium tracking-wider'>Welcome <span className='text-[#166e48] text-[19px] font-bold'> {activeUser.name}</span></h3>
              </div>
            </div>
          </div>

      }
    </>
  )
}

export default Chat