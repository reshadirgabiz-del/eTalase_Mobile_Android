import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href={'/store-select' as never} />;
}
