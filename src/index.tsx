export const Page: React.FC = () => {
  return <div>Hello, World</div>;
};

// Only `route` is read for SPAs ("*" catches everything not matched by an API route).
export const config = {
  name: "index",
  route: "*",
};
