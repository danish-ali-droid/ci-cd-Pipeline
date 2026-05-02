import{describe,it,expect} from  'vitest'
import{sum} from '../src/sum'

describe('sum',()=>{ 
    it('Add Two Numbers',()=>{expect(sum(2,3)).toBe(5);

    })
} )