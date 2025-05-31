import { HeaderSearchBox } from '@/components/HeaderSearchBox'

export const Header: React.FC = () => {
  return (
    <header role="banner" className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
          Or Halacha
        </h1>
        <HeaderSearchBox />
      </div>
    </header>
  )
}
