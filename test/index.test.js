const { should, expect } = require('chai')
const Router = require('../dist/index')

should()

describe('Error handling', () => {
  const router = new Router()

  it('Should throw an error if the url parameter is not a string', () => {
    function thereIsABadRoute() {
      router.get(undefined)
    }
    expect(thereIsABadRoute).to.throw(Error)
  })

  it("Should throw an error if there's no callback", () => {
    function thereIsABadRoute() {
      router.get('/')
    }
    expect(thereIsABadRoute).to.throw(Error)
  })

  it("Should throw an error if the callback doesn't have two arguments as input", () => {
    function thereIsABadRouteHandler() {
      router.get('/', x => x)
    }
    expect(thereIsABadRouteHandler).to.throw(Error)
  })
})
