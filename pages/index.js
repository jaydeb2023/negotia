import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <h1>Negotia — Sales Training</h1>
      <p className="sub">Practice negotiating with Gupta Ji — Level 1</p>
      <div className="actions">
        <Link href="/practice"><button className="primary">Start Practice</button></Link>
        <Link href="/dashboard"><button className="ghost">View Dashboard</button></Link>
      </div>
    </div>
  );
}
