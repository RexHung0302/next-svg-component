import Image from "next/image";
import Link from "next/link";

const Page = () => {
  return (
    <div className="flex flex-col gap-4 w-full h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">👇 Normal Svg Import Demo 👇</h1>
      <Image
        className="dark:invert"
        src="/github.svg"
        alt="Github logo"
        width={20}
        height={20}
        priority
      />
      {/* 這邊帶入程式碼範例 */}
      <code className="text-sm max-w-[300px] bg-gray-100 p-4 rounded-md overflow-x-auto text-black whitespace-pre-wrap">
        {`import Image from "next/image";

const Page = () => {
  return (
    <div>
      <Image src="/github.svg" alt="Github logo" width={20} height={20} />
    </div>
  );
};`}
      </code>
      
      <hr className="w-[300px] border-t-2 border-gray-300" />
      <div className="flex gap-4 cursor-pointer text-blue-500 hover:underline">
        <Link href="/">👈 Back to Home</Link>
      </div>
    </div>
  );
};

export default Page;