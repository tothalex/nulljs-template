export const Page: React.FC = (props) => {
  return <div>Hello, World</div>;
};

const props = async () => {
  return { message: "Hello, World!" };
};

export default {
  name: "react-handler",
  timeout: 1000,
  route: "foo",
  props,
};
