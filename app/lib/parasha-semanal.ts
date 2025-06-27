useEffect(() => {
  const getParasha = async () => {
    const res = await fetch('/api/parasha')
    const data = await res.json()
    setParasha(data)
  }
  getParasha()
}, [])
