const { gql, GraphQLClient } = require("graphql-request");
const endpoint = process.env.ENDPOINT;

const graphClient = (endpoint, auth) =>
  new GraphQLClient(endpoint, {
    headers: {
      //authorization: "Bearer " + auth,
    },
  });

const GET_PROJECT = gql`
  query getProject($id: ID!) {
    project(id: $id) {
      id
      name
      avatar
      description
      website
      twitter
      github
      isRepresentative
    }
  }
`;

const GET_CHALLENGES = gql`
  {
    challenges(where: { resolved: false }) {
      project {
        name
        project: id
      }
    }
  }
`;

const FIND_PROJECT = gql`
  query findProject($name: String!) {
    projectSearch(text: $name) {
      id
      name
      avatar
      description
      website
      twitter
      github
      isRepresentative
    }
  }
`;

module.exports = {
  getProject: (id) => graphClient(endpoint).request(GET_PROJECT, { id }),
  findProject: (name) => graphClient(endpoint).request(FIND_PROJECT, { name }),
  getChallenges: () => graphClient(endpoint).request(GET_CHALLENGES),
};
