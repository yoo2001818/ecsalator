import expect from 'expect';

import Entity from '../src/entity';

describe('Entity', () => {
  describe('#get', () => {
    it('should return a component');
    it('should throw error when component is invalid');
    it('should throw error when entity is invalid');
  });
  describe('#set', () => {
    it('should set a component');
    it('should prevent overriding id component');
    it('should throw error when component is invalid');
    it('should throw error when entity is invalid');
    it('should emit an entity event');
    it('should emit a component event');
  });
  describe('#remove', () => {
    it('should remove a component');
    it('should prevent removing id component');
    it('should throw error when component is invalid');
    it('should throw error when entity is invalid');
    it('should emit an entity event');
    it('should emit a component event');
  });
});
